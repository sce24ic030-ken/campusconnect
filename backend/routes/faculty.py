# =========================================================
# FACULTY ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import admin_required

faculty_bp = Blueprint(
    "faculty",
    __name__,
    url_prefix="/api/faculty"
)

FACULTY_SELECT = (
    "SELECT id, name, department, designation, email, phone, subject, "
    "created_at FROM faculty"
)


# =========================================================
# LIST FACULTY (public)
# =========================================================

@faculty_bp.route("", methods=["GET"])
def list_faculty():

    department = request.args.get("department")

    query = FACULTY_SELECT + " WHERE 1=1"
    params = []

    if department:
        query += " AND department = %s"
        params.append(department)

    query += " ORDER BY name"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load faculty", 500, details=str(exc))


# =========================================================
# GET ONE FACULTY MEMBER (public)
# =========================================================

@faculty_bp.route("/<int:faculty_id>", methods=["GET"])
def get_faculty(faculty_id):

    try:
        row = query_one(FACULTY_SELECT + " WHERE id = %s", (faculty_id,))

        if not row:
            return error("Faculty member not found", 404)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load faculty member", 500, details=str(exc))


# =========================================================
# CREATE FACULTY (admin)
# =========================================================

@faculty_bp.route("", methods=["POST"])
@admin_required
def create_faculty():

    data = get_json()

    name = (data.get("name") or "").strip()

    if not name:
        return error("A name is required", 400)

    try:
        new_id = execute(
            "INSERT INTO faculty "
            "(name, department, designation, email, phone, subject) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (
                name,
                data.get("department"),
                data.get("designation"),
                data.get("email"),
                data.get("phone"),
                data.get("subject")
            ),
            return_id=True
        )

        row = query_one(FACULTY_SELECT + " WHERE id = %s", (new_id,))

        return success(row, message="Faculty member created", status=201)

    except mysql.connector.Error as exc:
        return error("Could not create faculty member", 500, details=str(exc))


# =========================================================
# UPDATE FACULTY (admin)
# =========================================================

@faculty_bp.route("/<int:faculty_id>", methods=["PUT"])
@admin_required
def update_faculty(faculty_id):

    if not query_one("SELECT id FROM faculty WHERE id = %s", (faculty_id,)):
        return error("Faculty member not found", 404)

    data = get_json()

    fields = {
        key: data[key]
        for key in ("name", "department", "designation", "email", "phone", "subject")
        if key in data
    }

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE faculty SET {set_clause} WHERE id = %s",
            (*fields.values(), faculty_id)
        )

        row = query_one(FACULTY_SELECT + " WHERE id = %s", (faculty_id,))

        return success(row, message="Faculty member updated")

    except mysql.connector.Error as exc:
        return error("Could not update faculty member", 500, details=str(exc))


# =========================================================
# DELETE FACULTY (admin)
# =========================================================

@faculty_bp.route("/<int:faculty_id>", methods=["DELETE"])
@admin_required
def delete_faculty(faculty_id):

    if not query_one("SELECT id FROM faculty WHERE id = %s", (faculty_id,)):
        return error("Faculty member not found", 404)

    try:
        execute("DELETE FROM faculty WHERE id = %s", (faculty_id,))
        return success(message="Faculty member deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete faculty member", 500, details=str(exc))
