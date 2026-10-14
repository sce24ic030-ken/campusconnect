# =========================================================
# CHATBOT ROUTES
# =========================================================

from flask import Blueprint, request, current_app
import mysql.connector
from time import time

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import optional_token, token_required
from services.chatbot_service import generate_reply
from services import asr_service

chatbot_bp = Blueprint(
    "chatbot",
    __name__,
    url_prefix="/api/chatbot"
)

CHAT_SELECT = (
    "SELECT id, user_id, sender, message, created_at FROM chatbot_messages"
)

# Simple per-IP sliding window rate limit (in-memory)
_RATE_BUCKET = {}
_RATE_MAX = 20        # max requests per window
_RATE_WINDOW = 60     # seconds


def _ip():
    return (request.headers.get("X-Forwarded-For") or request.remote_addr or "").split(",")[0].strip()


def _rate_limited():
    ip = _ip()
    now = int(time())
    bucket = _RATE_BUCKET.setdefault(ip, [])
    # Evict old
    cutoff = now - _RATE_WINDOW
    while bucket and bucket[0] < cutoff:
        bucket.pop(0)
    if len(bucket) >= _RATE_MAX:
        return True
    bucket.append(now)
    return False


# =========================================================
# SEND A MESSAGE TO THE CHATBOT
# =========================================================

@chatbot_bp.route("/message", methods=["POST"])
@optional_token
def send_message():
    data = get_json()
    message = (data.get("message") or "").strip()
    page = (data.get("page") or "").strip()

    if not message:
        return error("message is required", 400)

    if _rate_limited():
        return error("Rate limit exceeded. Please wait a moment before asking again.", 429)

    try:
        user_id = getattr(request, "user_id", None)
        if user_id:
            execute(
                "INSERT INTO chatbot_messages (user_id, sender, message) "
                "VALUES (%s, 'user', %s)",
                (user_id, message)
            )

        reply, intent = generate_reply(user_id, message, page_hint=page)

        if user_id:
            bot_id = execute(
                "INSERT INTO chatbot_messages (user_id, sender, message) "
                "VALUES (%s, 'bot', %s)",
                (user_id, reply),
                return_id=True
            )
            bot_row = query_one(CHAT_SELECT + " WHERE id = %s", (bot_id,))
            return success({
                "reply": reply,
                "intent": intent,
                "message": bot_row
            })

        return success({
            "reply": reply,
            "intent": intent
        })

    except mysql.connector.Error as exc:
        current_app.logger.warning("Chatbot DB error: %s", exc)
        reply, intent = generate_reply(getattr(request, "user_id", None), message, page_hint=page)
        return success({"reply": reply, "intent": intent})


# =========================================================
# VOICE INPUT — TRANSCRIBE AN AUDIO CLIP
# The browser records a short clip and posts it here; we relay
# it to NVIDIA's hosted speech NIM over gRPC and hand the text
# straight back to the chat widget.
# =========================================================

@chatbot_bp.route("/transcribe", methods=["POST"])
@optional_token
def transcribe_audio():
    if not asr_service.available():
        return error("Voice input is not available on this server", 503)

    upload = request.files.get("file")
    if upload is None:
        return error("file is required", 400)

    audio = upload.read()
    if not audio:
        return error("Empty audio clip", 400)

    if len(audio) > current_app.config["ASR_MAX_BYTES"]:
        return error("Audio clip is too large", 413)

    if _rate_limited():
        return error("Rate limit exceeded. Please wait a moment before speaking again.", 429)

    language = (request.form.get("language") or "").strip() or None

    try:
        text = asr_service.transcribe(audio, language=language)
    except Exception as exc:  # noqa: BLE001 - gRPC/network/model errors
        current_app.logger.warning("ASR error: %s", exc)
        return error("Could not transcribe the audio", 502)

    return success({"text": text})


# =========================================================
# CHAT HISTORY
# =========================================================

@chatbot_bp.route("/history", methods=["GET"])
@token_required
def history():
    try:
        rows = query_all(
            CHAT_SELECT + " WHERE user_id = %s ORDER BY created_at ASC, id ASC",
            (request.user_id,)
        )
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load chat history", 500, details=str(exc))


# =========================================================
# CLEAR CHAT HISTORY
# =========================================================

@chatbot_bp.route("/history", methods=["DELETE"])
@token_required
def clear_history():
    try:
        execute(
            "DELETE FROM chatbot_messages WHERE user_id = %s",
            (request.user_id,)
        )
        return success(message="Chat history cleared")

    except mysql.connector.Error as exc:
        return error("Could not clear chat history", 500, details=str(exc))
