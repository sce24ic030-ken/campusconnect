# =========================================================
# STUDENTS / PROFILE ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required

students_bp = Blueprint(
    "students",
    __name__,
    url_prefix="/api/students"
)

PROFILE_SELECT = (
    "SELECT id, name, email, student_id, course, semester, phone, "
    "role, profile_image, created_at FROM users"
)

EDITABLE = {"name", "student_id", "course", "semester", "phone", "profile_image"}


# =========================================================
# MY PROFILE
# =========================================================

@students_bp.route("/me", methods=["GET"])
@token_required
def get_my_profile():

    try:
        user = query_one(PROFILE_SELECT + " WHERE id = %s", (request.user_id,))

        if not user:
            return error("User not found", 404)

        return success(user)

    except mysql.connector.Error as exc:
        return error("Could not load profile", 500, details=str(exc))


@students_bp.route("/me", methods=["PUT"])
@token_required
def update_my_profile():

    data = get_json()

    fields = {key: data[key] for key in EDITABLE if key in data}

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE users SET {set_clause} WHERE id = %s",
            (*fields.values(), request.user_id)
        )

        user = query_one(PROFILE_SELECT + " WHERE id = %s", (request.user_id,))

        return success(user, message="Profile updated")

    except mysql.connector.Error as exc:
        if exc.errno == 1062:
            return error("That student ID or email is already in use", 409)

        return error("Could not update profile", 500, details=str(exc))


# =========================================================
# ADMIN: LIST / VIEW STUDENTS
# =========================================================

@students_bp.route("", methods=["GET"])
@admin_required
def list_students():

    try:
        rows = query_all(PROFILE_SELECT + " ORDER BY id")
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not list students", 500, details=str(exc))


@students_bp.route("/<int:user_id>", methods=["GET"])
@admin_required
def get_student(user_id):

    try:
        user = query_one(PROFILE_SELECT + " WHERE id = %s", (user_id,))

        if not user:
            return error("Student not found", 404)

        return success(user)

    except mysql.connector.Error as exc:
        return error("Could not load student", 500, details=str(exc))
