# =========================================================
# ASSIGNMENTS ROUTES
# =========================================================

from datetime import datetime

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required
from utils.validators import parse_date, to_int, one_of

assignments_bp = Blueprint(
    "assignments",
    __name__,
    url_prefix="/api/assignments"
)

STATUSES = ("Pending", "Submitted", "Graded")

ASSIGNMENT_SELECT = (
    "SELECT a.id, a.user_id, a.course_id, c.course_name, c.course_code, "
    "c.faculty_name, "
    "a.title, a.description, a.due_date, a.status, a.submission_file, "
    "a.submitted_at, a.created_at "
    "FROM assignments a LEFT JOIN courses c ON a.course_id = c.id"
)


# =========================================================
# LIST MY ASSIGNMENTS
# =========================================================

@assignments_bp.route("", methods=["GET"])
@token_required
def list_assignments():

    status = request.args.get("status")

    query = ASSIGNMENT_SELECT + " WHERE a.user_id = %s"
    params = [request.user_id]

    if status:
        query += " AND a.status = %s"
        params.append(status)

    query += " ORDER BY a.due_date IS NULL, a.due_date ASC, a.id DESC"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load assignments", 500, details=str(exc))


# =========================================================
# LIST EVERY ASSIGNMENT (admin)
# =========================================================

@assignments_bp.route("/all", methods=["GET"])
@admin_required
def list_all_assignments():

    user_id = to_int(request.args.get("user_id"))
    status = request.args.get("status")

    query = (
        "SELECT a.id, a.user_id, a.course_id, c.course_name, c.course_code, "
        "c.faculty_name, "
        "a.title, a.description, a.due_date, a.status, a.submission_file, "
        "a.submitted_at, a.created_at, "
        "u.name AS student_name, u.email AS student_email "
        "FROM assignments a "
        "LEFT JOIN courses c ON a.course_id = c.id "
        "LEFT JOIN users u ON a.user_id = u.id "
        "WHERE 1=1"
    )
    params = []

    if user_id:
        query += " AND a.user_id = %s"
        params.append(user_id)

    if status:
        query += " AND a.status = %s"
        params.append(status)

    query += " ORDER BY a.due_date IS NULL, a.due_date ASC, a.id DESC"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load assignments", 500, details=str(exc))


# =========================================================
# GET ONE ASSIGNMENT
# =========================================================

@assignments_bp.route("/<int:assignment_id>", methods=["GET"])
@token_required
def get_assignment(assignment_id):

    try:
        row = query_one(ASSIGNMENT_SELECT + " WHERE a.id = %s", (assignment_id,))

        if not row:
            return error("Assignment not found", 404)

        if row["user_id"] != request.user_id and request.user_role != "admin":
            return error("Not allowed to view this assignment", 403)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load assignment", 500, details=str(exc))


# =========================================================
# CREATE ASSIGNMENT
# =========================================================

@assignments_bp.route("", methods=["POST"])
@admin_required
def create_assignment():

    data = get_json()

    target_user = to_int(data.get("user_id")) or request.user_id

    if target_user != request.user_id and request.user_role != "admin":
        return error("Not allowed to create an assignment for another user", 403)

    title = (data.get("title") or "").strip()

    if not title:
        return error("A title is required", 400)

    course_id = to_int(data.get("course_id"))
    description = data.get("description")
    due_date = parse_date(data.get("due_date"))

    if data.get("due_date") and not due_date:
        return error("due_date must be YYYY-MM-DD", 400)

    status = data.get("status", "Pending")

    if not one_of(status, STATUSES):
        return error("Status must be Pending, Submitted or Graded", 400)

    try:
        new_id = execute(
            "INSERT INTO assignments "
            "(user_id, course_id, title, description, due_date, status) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (target_user, course_id, title, description, due_date, status),
            return_id=True
        )

        row = query_one(ASSIGNMENT_SELECT + " WHERE a.id = %s", (new_id,))

        return success(row, message="Assignment created", status=201)

    except mysql.connector.Error as exc:
        return error("Could not create assignment", 500, details=str(exc))


# =========================================================
# UPDATE ASSIGNMENT
# =========================================================

@assignments_bp.route("/<int:assignment_id>", methods=["PUT"])
@admin_required
def update_assignment(assignment_id):

    existing = query_one(
        "SELECT user_id FROM assignments WHERE id = %s", (assignment_id,)
    )

    if not existing:
        return error("Assignment not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to update this assignment", 403)

    data = get_json()

    fields = {}

    for key in ("title", "description"):
        if key in data:
            fields[key] = data[key]

    if "course_id" in data:
        fields["course_id"] = to_int(data["course_id"])

    if "due_date" in data:
        parsed = parse_date(data["due_date"])
        if data["due_date"] and not parsed:
            return error("due_date must be YYYY-MM-DD", 400)
        fields["due_date"] = parsed

    if "status" in data:
        if not one_of(data["status"], STATUSES):
            return error("Invalid status", 400)
        fields["status"] = data["status"]

    if "submission_file" in data:
        fields["submission_file"] = data["submission_file"]

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE assignments SET {set_clause} WHERE id = %s",
            (*fields.values(), assignment_id)
        )

        row = query_one(ASSIGNMENT_SELECT + " WHERE a.id = %s", (assignment_id,))

        return success(row, message="Assignment updated")

    except mysql.connector.Error as exc:
        return error("Could not update assignment", 500, details=str(exc))


# =========================================================
# SUBMIT ASSIGNMENT
# =========================================================

@assignments_bp.route("/<int:assignment_id>/submit", methods=["POST"])
@token_required
def submit_assignment(assignment_id):

    existing = query_one(
        "SELECT user_id FROM assignments WHERE id = %s", (assignment_id,)
    )

    if not existing:
        return error("Assignment not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to submit this assignment", 403)

    data = get_json()
    submission_file = data.get("submission_file")

    try:
        execute(
            "UPDATE assignments SET status = 'Submitted', "
            "submission_file = %s, submitted_at = %s WHERE id = %s",
            (submission_file, datetime.now(), assignment_id)
        )

        row = query_one(ASSIGNMENT_SELECT + " WHERE a.id = %s", (assignment_id,))

        return success(row, message="Assignment submitted")

    except mysql.connector.Error as exc:
        return error("Could not submit assignment", 500, details=str(exc))


# =========================================================
# DELETE ASSIGNMENT
# =========================================================

@assignments_bp.route("/<int:assignment_id>", methods=["DELETE"])
@admin_required
def delete_assignment(assignment_id):

    existing = query_one(
        "SELECT user_id FROM assignments WHERE id = %s", (assignment_id,)
    )

    if not existing:
        return error("Assignment not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to delete this assignment", 403)

    try:
        execute("DELETE FROM assignments WHERE id = %s", (assignment_id,))
        return success(message="Assignment deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete assignment", 500, details=str(exc))
