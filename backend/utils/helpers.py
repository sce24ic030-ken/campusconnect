# =========================================================
# RESPONSE HELPERS
# Consistent JSON envelope for the whole API.
# =========================================================

from flask import jsonify


def success(data=None, message=None, status=200):
    """Return a success JSON response."""

    payload = {"success": True}

    if message is not None:
        payload["message"] = message

    if data is not None:
        payload["data"] = data

    return jsonify(payload), status


def error(message, status=400, **extra):
    """Return an error JSON response.

    Internal detail fields (database errors, stack traces) are stripped unless
    DEBUG is on, so they are never leaked to clients in production.
    """

    from flask import current_app

    if not current_app.config.get("DEBUG", False):
        extra = {
            key: value
            for key, value in extra.items()
            if key not in ("details", "error", "errors")
        }

    payload = {
        "success": False,
        "message": message
    }

    payload.update(extra)

    return jsonify(payload), status


def get_json():
    """Safely return the request JSON body (or an empty dict)."""

    from flask import request

    return request.get_json(silent=True) or {}
