# =========================================================
# ASR SERVICE (speech-to-text)
# Calls NVIDIA's hosted speech NIM over gRPC so voice input
# works in every browser. Reuses the chatbot's NVIDIA_API_KEY.
#
# The Riva client is imported lazily: the app must still boot
# (and the text chatbot must still work) if the optional
# "nvidia-riva-client" package is not installed, so we fail
# softly with a clear message instead of crashing on import.
# =========================================================

from flask import current_app


# ---------------------------------------------------------
# LAZY CLIENT (imported on first use, then reused)
# ---------------------------------------------------------

_rc = None          # the "riva.client" module
_service = None
_service_key = None

_MB = 1024 * 1024


def _client():
    """Return the ``riva.client`` module (imported on first use)."""

    global _rc
    if _rc is None:
        import riva.client
        _rc = riva.client
    return _rc


def available():
    """True when voice input is configured and the client is installed."""

    cfg = current_app.config

    if not cfg.get("ASR_ENABLED"):
        return False
    if not cfg.get("NVIDIA_API_KEY"):
        return False

    try:
        _client()
    except Exception:  # noqa: BLE001 - package not installed
        return False

    return True


def _get_service():
    """Build (once) and return an authenticated ASR gRPC service."""

    global _service, _service_key

    cfg = current_app.config
    key = (cfg["ASR_SERVER"], cfg["ASR_FUNCTION_ID"], cfg["NVIDIA_API_KEY"])

    if _service is not None and _service_key == key:
        return _service

    rc = _client()

    auth = rc.Auth(
        uri=cfg["ASR_SERVER"],
        use_ssl=True,
        metadata_args=[
            ["function-id", cfg["ASR_FUNCTION_ID"]],
            ["authorization", "Bearer " + cfg["NVIDIA_API_KEY"]],
        ],
        # Allow clips up to the upload limit in one gRPC message.
        options=[
            ("grpc.max_send_message_length", cfg["ASR_MAX_BYTES"] + _MB),
            ("grpc.max_receive_message_length", 16 * _MB),
        ],
    )

    _service = rc.ASRService(auth)
    _service_key = key
    return _service


def transcribe(audio_bytes, language=None):
    """Transcribe a WAV/FLAC/OPUS clip and return the plain-text transcript.

    The hosted model detects the container format from the file header, so
    the caller only needs to send a valid audio file.
    """

    cfg = current_app.config
    service = _get_service()
    rc = _client()

    settings = {
        "language_code": (language or cfg["ASR_LANGUAGE"]),
        "max_alternatives": 1,
        "enable_automatic_punctuation": True,
    }

    # An explicit model name is optional: the function-id already selects it.
    if cfg.get("ASR_MODEL"):
        settings["model"] = cfg["ASR_MODEL"]

    config = rc.RecognitionConfig(**settings)

    # future=True lets us apply a hard deadline so a stuck call can't hang
    # the worker forever.
    call = service.offline_recognize(audio_bytes, config, future=True)
    response = call.result(timeout=cfg["ASR_TIMEOUT"])

    parts = []
    for result in response.results:
        for alt in result.alternatives:
            text = (alt.transcript or "").strip()
            if text:
                parts.append(text)

    return " ".join(parts).strip()
