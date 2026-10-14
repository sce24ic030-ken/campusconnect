# =========================================================
# USER SETTINGS ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required

settings_bp = Blueprint(
    "settings",
    __name__,
    url_prefix="/api/settings"
)

EDITABLE = {
    "notifications_enabled",
    "email_notifications",
    "dark_mode",
    "language"
}

SETTINGS_SELECT = (
    "SELECT id, user_id, notifications_enabled, email_notifications, "
    "dark_mode, language, created_at, updated_at FROM user_settings"
)


def _ensure_row(user_id):
    """Create a default settings row for the user if it does not exist."""

    execute(
        "INSERT IGNORE INTO user_settings (user_id) VALUES (%s)",
        (user_id,)
    )


# =========================================================
# GET MY SETTINGS
# =========================================================

@settings_bp.route("", methods=["GET"])
@token_required
def get_settings():

    try:
        _ensure_row(request.user_id)

        row = query_one(
            SETTINGS_SELECT + " WHERE user_id = %s",
            (request.user_id,)
        )

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load settings", 500, details=str(exc))


# =========================================================
# UPDATE MY SETTINGS
# =========================================================

@settings_bp.route("", methods=["PUT"])
@token_required
def update_settings():

    data = get_json()

    fields = {key: data[key] for key in EDITABLE if key in data}

    if not fields:
        return error("No valid settings to update", 400)

    # Normalise booleans to 0/1 for MySQL
    for key in ("notifications_enabled", "email_notifications", "dark_mode"):
        if key in fields:
            fields[key] = 1 if fields[key] in (True, 1, "1", "true", "True") else 0

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        _ensure_row(request.user_id)

        execute(
            f"UPDATE user_settings SET {set_clause} WHERE user_id = %s",
            (*fields.values(), request.user_id)
        )

        row = query_one(
            SETTINGS_SELECT + " WHERE user_id = %s",
            (request.user_id,)
        )

        return success(row, message="Settings updated")

    except mysql.connector.Error as exc:
        return error("Could not update settings", 500, details=str(exc))
