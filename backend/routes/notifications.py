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
    "SELECT n.id, n.user_id, u.name AS student_name, n.title, n.message, "
    "n.type, n.is_read, n.created_at "
    "FROM notifications n LEFT JOIN users u ON n.user_id = u.id"
)


# =========================================================
# LIST MY NOTIFICATIONS
# =========================================================

@notifications_bp.route("", methods=["GET"])
@token_required
def list_notifications():

    unread_only = request.args.get("unread") in ("1", "true", "True")
    user_id = to_int(request.args.get("user_id"))

    query = NOTIFICATION_SELECT
    params = []

    if request.user_role == "admin":

        # Admins see the whole list, or one student's with ?user_id=
        query += " WHERE 1=1"

        if user_id:
            query += " AND n.user_id = %s"
            params.append(user_id)

    else:
        query += " WHERE n.user_id = %s"
        params.append(request.user_id)

    if unread_only:
        query += " AND n.is_read = 0"

    query += " ORDER BY n.created_at DESC, n.id DESC"

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

        row = query_one(NOTIFICATION_SELECT + " WHERE n.id = %s", (notification_id,))

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

        row = query_one(NOTIFICATION_SELECT + " WHERE n.id = %s", (new_id,))

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
# UPDATE NOTIFICATION (admin)
# =========================================================

@notifications_bp.route("/<int:notification_id>", methods=["PUT"])
@admin_required
def update_notification(notification_id):

    if not query_one("SELECT id FROM notifications WHERE id = %s", (notification_id,)):
        return error("Notification not found", 404)

    data = get_json()

    fields = {}

    for key in ("title", "message", "type"):
        if key in data:
            fields[key] = data[key]

    if not fields:
        return error("No valid fields to update", 400)

    for key in ("title", "message"):
        if key in fields and not (fields[key] or "").strip():
            return error(key + " cannot be empty", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE notifications SET {set_clause} WHERE id = %s",
            (*fields.values(), notification_id)
        )

        row = query_one(NOTIFICATION_SELECT + " WHERE n.id = %s", (notification_id,))

        return success(row, message="Notification updated")

    except mysql.connector.Error as exc:
        return error("Could not update notification", 500, details=str(exc))


# =========================================================
# DELETE NOTIFICATION
# =========================================================

@notifications_bp.route("/<int:notification_id>", methods=["DELETE"])
@admin_required
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
