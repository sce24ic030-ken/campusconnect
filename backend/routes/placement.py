# =========================================================
# PLACEMENT ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import admin_required
from utils.validators import parse_date

placement_bp = Blueprint(
    "placement",
    __name__,
    url_prefix="/api/placements"
)

PLACEMENT_SELECT = (
    "SELECT id, company_name, job_role, description, eligibility, package, "
    "location, application_deadline, application_link, created_at FROM placements"
)


# =========================================================
# LIST PLACEMENTS (public)
# =========================================================

@placement_bp.route("", methods=["GET"])
def list_placements():

    search = request.args.get("q")
    open_only = request.args.get("open") in ("1", "true", "True")

    query = PLACEMENT_SELECT + " WHERE 1=1"
    params = []

    if search:
        query += " AND (company_name LIKE %s OR job_role LIKE %s)"
        like = f"%{search}%"
        params.extend([like, like])

    if open_only:
        query += " AND (application_deadline IS NULL OR application_deadline >= CURDATE())"

    query += " ORDER BY application_deadline IS NULL, application_deadline ASC"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load placements", 500, details=str(exc))


# =========================================================
# GET ONE PLACEMENT (public)
# =========================================================

@placement_bp.route("/<int:placement_id>", methods=["GET"])
def get_placement(placement_id):

    try:
        row = query_one(PLACEMENT_SELECT + " WHERE id = %s", (placement_id,))

        if not row:
            return error("Placement not found", 404)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load placement", 500, details=str(exc))


# =========================================================
# CREATE PLACEMENT (admin)
# =========================================================

@placement_bp.route("", methods=["POST"])
@admin_required
def create_placement():

    data = get_json()

    company_name = (data.get("company_name") or "").strip()

    if not company_name:
        return error("company_name is required", 400)

    deadline = parse_date(data.get("application_deadline"))

    if data.get("application_deadline") and not deadline:
        return error("application_deadline must be YYYY-MM-DD", 400)

    try:
        new_id = execute(
            "INSERT INTO placements "
            "(company_name, job_role, description, eligibility, package, location, "
            "application_deadline, application_link) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (
                company_name,
                data.get("job_role"),
                data.get("description"),
                data.get("eligibility"),
                data.get("package"),
                data.get("location"),
                deadline,
                data.get("application_link")
            ),
            return_id=True
        )

        row = query_one(PLACEMENT_SELECT + " WHERE id = %s", (new_id,))

        return success(row, message="Placement created", status=201)

    except mysql.connector.Error as exc:
        return error("Could not create placement", 500, details=str(exc))


# =========================================================
# UPDATE PLACEMENT (admin)
# =========================================================

@placement_bp.route("/<int:placement_id>", methods=["PUT"])
@admin_required
def update_placement(placement_id):

    if not query_one("SELECT id FROM placements WHERE id = %s", (placement_id,)):
        return error("Placement not found", 404)

    data = get_json()

    fields = {}

    for key in (
        "company_name", "job_role", "description",
        "eligibility", "package", "location", "application_link"
    ):
        if key in data:
            fields[key] = data[key]

    if "application_deadline" in data:
        parsed = parse_date(data["application_deadline"])
        if data["application_deadline"] and not parsed:
            return error("application_deadline must be YYYY-MM-DD", 400)
        fields["application_deadline"] = parsed

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE placements SET {set_clause} WHERE id = %s",
            (*fields.values(), placement_id)
        )

        row = query_one(PLACEMENT_SELECT + " WHERE id = %s", (placement_id,))

        return success(row, message="Placement updated")

    except mysql.connector.Error as exc:
        return error("Could not update placement", 500, details=str(exc))


# =========================================================
# DELETE PLACEMENT (admin)
# =========================================================

@placement_bp.route("/<int:placement_id>", methods=["DELETE"])
@admin_required
def delete_placement(placement_id):

    if not query_one("SELECT id FROM placements WHERE id = %s", (placement_id,)):
        return error("Placement not found", 404)

    try:
        execute("DELETE FROM placements WHERE id = %s", (placement_id,))
        return success(message="Placement deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete placement", 500, details=str(exc))
