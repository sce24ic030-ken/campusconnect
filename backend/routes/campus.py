# =========================================================
# CAMPUS ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import admin_required

campus_bp = Blueprint(
    "campus",
    __name__,
    url_prefix="/api/campus"
)

CAMPUS_SELECT = (
    "SELECT id, name, category, description, location, contact, "
    "created_at FROM campus"
)


# =========================================================
# LIST CAMPUS FACILITIES (public)
# =========================================================

@campus_bp.route("", methods=["GET"])
def list_campus():

    category = request.args.get("category")

    query = CAMPUS_SELECT + " WHERE 1=1"
    params = []

    if category:
        query += " AND category = %s"
        params.append(category)

    query += " ORDER BY category, name"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load campus information", 500, details=str(exc))


# =========================================================
# GET ONE CAMPUS FACILITY (public)
# =========================================================

@campus_bp.route("/<int:campus_id>", methods=["GET"])
def get_campus(campus_id):

    try:
        row = query_one(CAMPUS_SELECT + " WHERE id = %s", (campus_id,))

        if not row:
            return error("Campus facility not found", 404)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load campus facility", 500, details=str(exc))


# =========================================================
# CREATE CAMPUS FACILITY (admin)
# =========================================================

@campus_bp.route("", methods=["POST"])
@admin_required
def create_campus():

    data = get_json()

    name = (data.get("name") or "").strip()

    if not name:
        return error("A name is required", 400)

    try:
        new_id = execute(
            "INSERT INTO campus (name, category, description, location, contact) "
            "VALUES (%s, %s, %s, %s, %s)",
            (
                name,
                data.get("category"),
                data.get("description"),
                data.get("location"),
                data.get("contact")
            ),
            return_id=True
        )

        row = query_one(CAMPUS_SELECT + " WHERE id = %s", (new_id,))

        return success(row, message="Campus facility created", status=201)

    except mysql.connector.Error as exc:
        return error("Could not create campus facility", 500, details=str(exc))


# =========================================================
# UPDATE CAMPUS FACILITY (admin)
# =========================================================

@campus_bp.route("/<int:campus_id>", methods=["PUT"])
@admin_required
def update_campus(campus_id):

    if not query_one("SELECT id FROM campus WHERE id = %s", (campus_id,)):
        return error("Campus facility not found", 404)

    data = get_json()

    fields = {
        key: data[key]
        for key in ("name", "category", "description", "location", "contact")
        if key in data
    }

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE campus SET {set_clause} WHERE id = %s",
            (*fields.values(), campus_id)
        )

        row = query_one(CAMPUS_SELECT + " WHERE id = %s", (campus_id,))

        return success(row, message="Campus facility updated")

    except mysql.connector.Error as exc:
        return error("Could not update campus facility", 500, details=str(exc))


# =========================================================
# DELETE CAMPUS FACILITY (admin)
# =========================================================

@campus_bp.route("/<int:campus_id>", methods=["DELETE"])
@admin_required
def delete_campus(campus_id):

    if not query_one("SELECT id FROM campus WHERE id = %s", (campus_id,)):
        return error("Campus facility not found", 404)

    try:
        execute("DELETE FROM campus WHERE id = %s", (campus_id,))
        return success(message="Campus facility deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete campus facility", 500, details=str(exc))
