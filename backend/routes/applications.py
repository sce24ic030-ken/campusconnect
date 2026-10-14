# =========================================================
# PLACEMENT APPLICATION ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required
from utils.validators import to_int

applications_bp = Blueprint(
    "applications",
    __name__,
    url_prefix="/api/applications"
)

APPLICATION_SELECT = (
    "SELECT ap.id, ap.user_id, ap.placement_id, p.company_name, p.job_role, "
    "p.location, p.package, ap.status, ap.cover_note, ap.applied_at "
    "FROM applications ap LEFT JOIN placements p ON ap.placement_id = p.id"
)


# =========================================================
# LIST MY APPLICATIONS
# =========================================================

@applications_bp.route("", methods=["GET"])
@token_required
def list_applications():

    query = APPLICATION_SELECT
    params = []

    if request.user_role == "admin" and request.args.get("all") in ("1", "true", "True"):
        query += " ORDER BY ap.applied_at DESC"
    else:
        query += " WHERE ap.user_id = %s ORDER BY ap.applied_at DESC"
        params.append(request.user_id)

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load applications", 500, details=str(exc))


# =========================================================
# GET ONE APPLICATION
# =========================================================

@applications_bp.route("/<int:application_id>", methods=["GET"])
@token_required
def get_application(application_id):

    try:
        row = query_one(APPLICATION_SELECT + " WHERE ap.id = %s", (application_id,))

        if not row:
            return error("Application not found", 404)

        if row["user_id"] != request.user_id and request.user_role != "admin":
            return error("Not allowed to view this application", 403)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load application", 500, details=str(exc))


# =========================================================
# APPLY TO A PLACEMENT
# =========================================================

@applications_bp.route("", methods=["POST"])
@token_required
def apply_to_placement():

    data = get_json()

    placement_id = to_int(data.get("placement_id"))

    if not placement_id:
        return error("placement_id is required", 400)

    if not query_one("SELECT id FROM placements WHERE id = %s", (placement_id,)):
        return error("Placement not found", 404)

    try:
        new_id = execute(
            "INSERT INTO applications (user_id, placement_id, cover_note) "
            "VALUES (%s, %s, %s)",
            (request.user_id, placement_id, data.get("cover_note")),
            return_id=True
        )

        row = query_one(APPLICATION_SELECT + " WHERE ap.id = %s", (new_id,))

        return success(row, message="Application submitted", status=201)

    except mysql.connector.Error as exc:
        if exc.errno == 1062:
            return error("You have already applied to this placement", 409)
        return error("Could not submit application", 500, details=str(exc))


# =========================================================
# UPDATE APPLICATION STATUS (admin)
# =========================================================

@applications_bp.route("/<int:application_id>", methods=["PUT"])
@admin_required
def update_application(application_id):

    if not query_one("SELECT id FROM applications WHERE id = %s", (application_id,)):
        return error("Application not found", 404)

    data = get_json()

    fields = {}

    if "status" in data:
        fields["status"] = data["status"]

    if "cover_note" in data:
        fields["cover_note"] = data["cover_note"]

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE applications SET {set_clause} WHERE id = %s",
            (*fields.values(), application_id)
        )

        row = query_one(APPLICATION_SELECT + " WHERE ap.id = %s", (application_id,))

        return success(row, message="Application updated")

    except mysql.connector.Error as exc:
        return error("Could not update application", 500, details=str(exc))


# =========================================================
# WITHDRAW APPLICATION
# =========================================================

@applications_bp.route("/<int:application_id>", methods=["DELETE"])
@token_required
def delete_application(application_id):

    existing = query_one(
        "SELECT user_id FROM applications WHERE id = %s", (application_id,)
    )

    if not existing:
        return error("Application not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to withdraw this application", 403)

    try:
        execute("DELETE FROM applications WHERE id = %s", (application_id,))
        return success(message="Application withdrawn")

    except mysql.connector.Error as exc:
        return error("Could not withdraw application", 500, details=str(exc))
