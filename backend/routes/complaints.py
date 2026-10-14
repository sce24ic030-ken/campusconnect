# =========================================================
# COMPLAINTS ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required
from utils.validators import one_of

complaints_bp = Blueprint(
    "complaints",
    __name__,
    url_prefix="/api/complaints"
)

STATUSES = ("Pending", "In Progress", "Resolved", "Rejected")

COMPLAINT_SELECT = (
    "SELECT c.id, c.user_id, u.name AS student_name, c.subject, "
    "c.description, c.status, c.response, c.created_at "
    "FROM complaints c LEFT JOIN users u ON c.user_id = u.id"
)


# =========================================================
# LIST COMPLAINTS (own, or all for admins)
# =========================================================

@complaints_bp.route("", methods=["GET"])
@token_required
def list_complaints():

    status = request.args.get("status")

    query = COMPLAINT_SELECT
    params = []

    if request.user_role == "admin" and request.args.get("all") in ("1", "true", "True"):
        query += " WHERE 1=1"
    else:
        query += " WHERE c.user_id = %s"
        params.append(request.user_id)

    if status:
        query += " AND c.status = %s"
        params.append(status)

    query += " ORDER BY c.created_at DESC, c.id DESC"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load complaints", 500, details=str(exc))


# =========================================================
# GET ONE COMPLAINT
# =========================================================

@complaints_bp.route("/<int:complaint_id>", methods=["GET"])
@token_required
def get_complaint(complaint_id):

    try:
        row = query_one(COMPLAINT_SELECT + " WHERE c.id = %s", (complaint_id,))

        if not row:
            return error("Complaint not found", 404)

        if row["user_id"] != request.user_id and request.user_role != "admin":
            return error("Not allowed to view this complaint", 403)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load complaint", 500, details=str(exc))


# =========================================================
# SUBMIT A COMPLAINT
# =========================================================

@complaints_bp.route("", methods=["POST"])
@token_required
def create_complaint():

    data = get_json()

    subject = (data.get("subject") or "").strip()
    description = (data.get("description") or "").strip()

    if not subject or not description:
        return error("subject and description are required", 400)

    try:
        new_id = execute(
            "INSERT INTO complaints (user_id, subject, description) "
            "VALUES (%s, %s, %s)",
            (request.user_id, subject, description),
            return_id=True
        )

        row = query_one(COMPLAINT_SELECT + " WHERE c.id = %s", (new_id,))

        return success(row, message="Complaint submitted", status=201)

    except mysql.connector.Error as exc:
        return error("Could not submit complaint", 500, details=str(exc))


# =========================================================
# RESPOND TO A COMPLAINT (admin)
# =========================================================

@complaints_bp.route("/<int:complaint_id>", methods=["PUT"])
@admin_required
def respond_to_complaint(complaint_id):

    if not query_one("SELECT id FROM complaints WHERE id = %s", (complaint_id,)):
        return error("Complaint not found", 404)

    data = get_json()

    fields = {}

    if "status" in data:
        if not one_of(data["status"], STATUSES):
            return error(
                "status must be Pending, In Progress, Resolved or Rejected", 400
            )
        fields["status"] = data["status"]

    if "response" in data:
        fields["response"] = data["response"]

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE complaints SET {set_clause} WHERE id = %s",
            (*fields.values(), complaint_id)
        )

        row = query_one(COMPLAINT_SELECT + " WHERE c.id = %s", (complaint_id,))

        return success(row, message="Complaint updated")

    except mysql.connector.Error as exc:
        return error("Could not update complaint", 500, details=str(exc))


# =========================================================
# DELETE A COMPLAINT (admin)
# =========================================================

@complaints_bp.route("/<int:complaint_id>", methods=["DELETE"])
@admin_required
def delete_complaint(complaint_id):

    if not query_one("SELECT id FROM complaints WHERE id = %s", (complaint_id,)):
        return error("Complaint not found", 404)

    try:
        execute("DELETE FROM complaints WHERE id = %s", (complaint_id,))
        return success(message="Complaint deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete complaint", 500, details=str(exc))
