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
