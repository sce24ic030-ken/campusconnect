# =========================================================
# NOTIFICATIONS ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required
from utils.validators import to_int
from services.notification_service import create_notification, notify_all

notifications_bp = Blueprint(
    "notifications",
    __name__,
    url_prefix="/api/notifications"
)

NOTIFICATION_SELECT = (
    "SELECT id, user_id, title, message, type, is_read, created_at "
    "FROM notifications"
)


# =========================================================
# LIST MY NOTIFICATIONS
# =========================================================

@notifications_bp.route("", methods=["GET"])
@token_required
def list_notifications():

    unread_only = request.args.get("unread") in ("1", "true", "True")

    query = NOTIFICATION_SELECT + " WHERE user_id = %s"
    params = [request.user_id]

    if unread_only:
        query += " AND is_read = 0"

    query += " ORDER BY created_at DESC, id DESC"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load notifications", 500, details=str(exc))


# =========================================================
# UNREAD COUNT
# =========================================================

@notifications_bp.route("/unread-count", methods=["GET"])
@token_required
def unread_count():

    try:
        row = query_one(
            "SELECT COUNT(*) AS unread FROM notifications "
            "WHERE user_id = %s AND is_read = 0",
            (request.user_id,)
        )

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not count notifications", 500, details=str(exc))


# =========================================================
# MARK ALL AS READ
# =========================================================

@notifications_bp.route("/read-all", methods=["PUT"])
@token_required
def mark_all_read():

    try:
        updated = execute(
            "UPDATE notifications SET is_read = 1 "
            "WHERE user_id = %s AND is_read = 0",
            (request.user_id,)
        )

        return success(message=f"{updated} notification(s) marked as read")

    except mysql.connector.Error as exc:
        return error("Could not update notifications", 500, details=str(exc))


# =========================================================
# MARK ONE AS READ
# =========================================================

@notifications_bp.route("/<int:notification_id>/read", methods=["PUT"])
@token_required
def mark_read(notification_id):

    existing = query_one(
        "SELECT user_id FROM notifications WHERE id = %s", (notification_id,)
    )

    if not existing:
        return error("Notification not found", 404)

    if existing["user_id"] != request.user_id:
        return error("Not allowed to update this notification", 403)

    try:
        execute(
            "UPDATE notifications SET is_read = 1 WHERE id = %s",
            (notification_id,)
        )

        row = query_one(NOTIFICATION_SELECT + " WHERE id = %s", (notification_id,))

        return success(row, message="Notification marked as read")

    except mysql.connector.Error as exc:
        return error("Could not update notification", 500, details=str(exc))


# =========================================================
# CREATE NOTIFICATION (admin)
# =========================================================

@notifications_bp.route("", methods=["POST"])
@admin_required
def create_single_notification():

    data = get_json()

    user_id = to_int(data.get("user_id"))
    title = (data.get("title") or "").strip()
    message = (data.get("message") or "").strip()

    if not user_id:
        return error("user_id is required", 400)

    if not title or not message:
        return error("title and message are required", 400)

    if not query_one("SELECT id FROM users WHERE id = %s", (user_id,)):
        return error("User not found", 404)

    try:
        new_id = create_notification(
            user_id, title, message, data.get("type", "general")
        )

        row = query_one(NOTIFICATION_SELECT + " WHERE id = %s", (new_id,))

        return success(row, message="Notification created", status=201)

    except mysql.connector.Error as exc:
        return error("Could not create notification", 500, details=str(exc))


# =========================================================
# BROADCAST TO ALL STUDENTS (admin)
# =========================================================

@notifications_bp.route("/broadcast", methods=["POST"])
@admin_required
def broadcast_notification():

    data = get_json()

    title = (data.get("title") or "").strip()
    message = (data.get("message") or "").strip()

    if not title or not message:
        return error("title and message are required", 400)

    try:
        sent = notify_all(title, message, data.get("type", "announcement"))

        return success(
            {"sent": sent},
            message=f"Notification sent to {sent} student(s)",
            status=201
        )

    except mysql.connector.Error as exc:
        return error("Could not broadcast notification", 500, details=str(exc))


# =========================================================
# DELETE NOTIFICATION
# =========================================================

@notifications_bp.route("/<int:notification_id>", methods=["DELETE"])
@token_required
def delete_notification(notification_id):

    existing = query_one(
        "SELECT user_id FROM notifications WHERE id = %s", (notification_id,)
    )

    if not existing:
        return error("Notification not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to delete this notification", 403)

    try:
        execute("DELETE FROM notifications WHERE id = %s", (notification_id,))
        return success(message="Notification deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete notification", 500, details=str(exc))
