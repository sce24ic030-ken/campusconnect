# =========================================================
# EXAMS ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required
from utils.validators import parse_date, parse_time, to_int

exams_bp = Blueprint(
    "exams",
    __name__,
    url_prefix="/api/exams"
)

EXAM_SELECT = (
    "SELECT e.id, e.user_id, u.name AS student_name, e.course_id, "
    "c.course_name, c.course_code, "
    "e.exam_name, e.exam_date, e.start_time, e.end_time, e.room, "
    "e.exam_type, e.created_at "
    "FROM exams e LEFT JOIN courses c ON e.course_id = c.id "
    "LEFT JOIN users u ON e.user_id = u.id"
)


# =========================================================
# LIST MY EXAMS
# =========================================================

@exams_bp.route("", methods=["GET"])
@token_required
def list_exams():

    upcoming = request.args.get("upcoming") in ("1", "true", "True")
    user_id = to_int(request.args.get("user_id"))

    if request.user_role == "admin":

        # Admins may see every exam, or one student's with ?user_id=
        query = EXAM_SELECT + " WHERE 1=1"
        params = []

        if user_id:
            query += " AND e.user_id = %s"
            params.append(user_id)

    else:
        query = EXAM_SELECT + " WHERE e.user_id = %s"
        params = [request.user_id]

    if upcoming:
        query += " AND e.exam_date >= CURDATE()"

    query += " ORDER BY e.exam_date IS NULL, e.exam_date ASC, e.start_time ASC"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load exams", 500, details=str(exc))


# =========================================================
# GET ONE EXAM
# =========================================================

@exams_bp.route("/<int:exam_id>", methods=["GET"])
@token_required
def get_exam(exam_id):

    try:
        row = query_one(EXAM_SELECT + " WHERE e.id = %s", (exam_id,))

        if not row:
            return error("Exam not found", 404)

        if row["user_id"] != request.user_id and request.user_role != "admin":
            return error("Not allowed to view this exam", 403)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load exam", 500, details=str(exc))


# =========================================================
# CREATE EXAM
# =========================================================

@exams_bp.route("", methods=["POST"])
@admin_required
def create_exam():

    data = get_json()

    target_user = to_int(data.get("user_id")) or request.user_id

    if target_user != request.user_id and request.user_role != "admin":
        return error("Not allowed to create an exam for another user", 403)

    exam_name = (data.get("exam_name") or "").strip()

    if not exam_name:
        return error("An exam_name is required", 400)

    exam_date = parse_date(data.get("exam_date"))

    if data.get("exam_date") and not exam_date:
        return error("exam_date must be YYYY-MM-DD", 400)

    start_time = parse_time(data.get("start_time"))
    end_time = parse_time(data.get("end_time"))

    try:
        new_id = execute(
            "INSERT INTO exams "
            "(user_id, course_id, exam_name, exam_date, start_time, end_time, room, exam_type) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (
                target_user,
                to_int(data.get("course_id")),
                exam_name,
                exam_date,
                start_time,
                end_time,
                data.get("room"),
                data.get("exam_type")
            ),
            return_id=True
        )

        row = query_one(EXAM_SELECT + " WHERE e.id = %s", (new_id,))

        return success(row, message="Exam created", status=201)

    except mysql.connector.Error as exc:
        return error("Could not create exam", 500, details=str(exc))


# =========================================================
# UPDATE EXAM
# =========================================================

@exams_bp.route("/<int:exam_id>", methods=["PUT"])
@admin_required
def update_exam(exam_id):

    existing = query_one("SELECT user_id FROM exams WHERE id = %s", (exam_id,))

    if not existing:
        return error("Exam not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to update this exam", 403)

    data = get_json()

    fields = {}

    for key in ("exam_name", "room", "exam_type"):
        if key in data:
            fields[key] = data[key]

    if "course_id" in data:
        fields["course_id"] = to_int(data["course_id"])

    if "exam_date" in data:
        parsed = parse_date(data["exam_date"])
        if data["exam_date"] and not parsed:
            return error("exam_date must be YYYY-MM-DD", 400)
        fields["exam_date"] = parsed

    for key in ("start_time", "end_time"):
        if key in data:
            parsed = parse_time(data[key])
            if data[key] and not parsed:
                return error(f"{key} must be HH:MM", 400)
            fields[key] = parsed

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE exams SET {set_clause} WHERE id = %s",
            (*fields.values(), exam_id)
        )

        row = query_one(EXAM_SELECT + " WHERE e.id = %s", (exam_id,))

        return success(row, message="Exam updated")

    except mysql.connector.Error as exc:
        return error("Could not update exam", 500, details=str(exc))


# =========================================================
# DELETE EXAM
# =========================================================

@exams_bp.route("/<int:exam_id>", methods=["DELETE"])
@admin_required
def delete_exam(exam_id):

    existing = query_one("SELECT user_id FROM exams WHERE id = %s", (exam_id,))

    if not existing:
        return error("Exam not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to delete this exam", 403)

    try:
        execute("DELETE FROM exams WHERE id = %s", (exam_id,))
        return success(message="Exam deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete exam", 500, details=str(exc))
