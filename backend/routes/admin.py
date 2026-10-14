# =========================================================
# ADMIN ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import admin_required
from utils.validators import one_of

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)

ROLES = ("student", "faculty", "admin")

USER_SELECT = (
    "SELECT id, name, email, student_id, course, semester, phone, "
    "role, profile_image, created_at FROM users"
)


# =========================================================
# DASHBOARD STATISTICS
# =========================================================

@admin_bp.route("/stats", methods=["GET"])
@admin_required
def stats():

    query = (
        "SELECT "
        "(SELECT COUNT(*) FROM users) AS total_users, "
        "(SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students, "
        "(SELECT COUNT(*) FROM courses) AS total_courses, "
        "(SELECT COUNT(*) FROM events) AS total_events, "
        "(SELECT COUNT(*) FROM placements) AS total_placements, "
        "(SELECT COUNT(*) FROM applications) AS total_applications, "
        "(SELECT COUNT(*) FROM complaints WHERE status = 'Pending') AS pending_complaints, "
        "(SELECT COUNT(*) FROM feedback) AS total_feedback, "
        "(SELECT COUNT(*) FROM lost_found WHERE status = 'Open') AS open_lost_found"
    )

    try:
        return success(query_one(query))

    except mysql.connector.Error as exc:
        return error("Could not build statistics", 500, details=str(exc))


# =========================================================
# LIST ALL USERS
# =========================================================

@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():

    role = request.args.get("role")

    query = USER_SELECT + " WHERE 1=1"
    params = []

    if role:
        query += " AND role = %s"
        params.append(role)

    query += " ORDER BY id"

    try:
        return success(query_all(query, tuple(params)))

    except mysql.connector.Error as exc:
        return error("Could not list users", 500, details=str(exc))


# =========================================================
# UPDATE A USER'S ROLE
# =========================================================

@admin_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@admin_required
def update_role(user_id):

    if not query_one("SELECT id FROM users WHERE id = %s", (user_id,)):
        return error("User not found", 404)

    data = get_json()
    role = data.get("role")

    if not one_of(role, ROLES):
        return error("role must be student, faculty or admin", 400)

    try:
        execute("UPDATE users SET role = %s WHERE id = %s", (role, user_id))

        row = query_one(USER_SELECT + " WHERE id = %s", (user_id,))

        return success(row, message="User role updated")

    except mysql.connector.Error as exc:
        return error("Could not update user role", 500, details=str(exc))


# =========================================================
# DELETE A USER
# =========================================================

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):

    if not query_one("SELECT id FROM users WHERE id = %s", (user_id,)):
        return error("User not found", 404)

    try:
        execute("DELETE FROM users WHERE id = %s", (user_id,))
        return success(message="User deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete user", 500, details=str(exc))
