# =========================================================
# RESULTS ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required
from utils.validators import to_int

results_bp = Blueprint(
    "results",
    __name__,
    url_prefix="/api/results"
)

RESULT_SELECT = (
    "SELECT r.id, r.user_id, u.name AS student_name, r.course_code, "
    "r.subject, r.semester, r.marks, r.max_marks, "
    "r.grade, r.result_status, r.created_at "
    "FROM results r LEFT JOIN users u ON r.user_id = u.id"
)


def _grade_from_percentage(percentage):
    """Return a letter grade for a percentage."""

    if percentage is None:
        return None

    if percentage >= 90:
        return "A+"
    if percentage >= 80:
        return "A"
    if percentage >= 70:
        return "B+"
    if percentage >= 60:
        return "B"
    if percentage >= 50:
        return "C"
    if percentage >= 40:
        return "D"

    return "F"


def _grade_points(grade):
    """Return grade points (0-10) for a letter grade."""

    return {
        "A+": 10, "A": 9, "B+": 8, "B": 7,
        "C": 6, "D": 5, "F": 0
    }.get((grade or "").upper(), 0)


# =========================================================
# LIST MY RESULTS
# =========================================================

@results_bp.route("", methods=["GET"])
@token_required
def list_results():

    semester = request.args.get("semester")
    user_id = to_int(request.args.get("user_id"))

    query = RESULT_SELECT
    params = []

    if request.user_role == "admin":

        # Admins may see every result, or one student's with ?user_id=
        query += " WHERE 1=1"

        if user_id:
            query += " AND r.user_id = %s"
            params.append(user_id)

    else:
        query += " WHERE r.user_id = %s"
        params.append(request.user_id)

    if semester:
        query += " AND r.semester = %s"
        params.append(semester)

    query += " ORDER BY r.semester, r.subject"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load results", 500, details=str(exc))


# =========================================================
# MY RESULTS SUMMARY (GPA)
# =========================================================

@results_bp.route("/summary", methods=["GET"])
@token_required
def results_summary():

    try:
        rows = query_all(
            RESULT_SELECT + " WHERE r.user_id = %s AND r.result_status = 'Published'",
            (request.user_id,)
        )

        if not rows:
            return success({
                "total_subjects": 0,
                "average_percentage": 0,
                "gpa": 0
            })

        total_points = 0
        total_percentage = 0

        for row in rows:
            marks = row.get("marks") or 0
            max_marks = row.get("max_marks") or 100
            percentage = (marks / max_marks) * 100 if max_marks else 0

            total_percentage += percentage
            total_points += _grade_points(
                row.get("grade") or _grade_from_percentage(percentage)
            )

        count = len(rows)

        return success({
            "total_subjects": count,
            "average_percentage": round(total_percentage / count, 2),
            "gpa": round(total_points / count, 2)
        })

    except mysql.connector.Error as exc:
        return error("Could not build results summary", 500, details=str(exc))


# =========================================================
# GET ONE RESULT
# =========================================================

@results_bp.route("/<int:result_id>", methods=["GET"])
@token_required
def get_result(result_id):

    try:
        row = query_one(RESULT_SELECT + " WHERE r.id = %s", (result_id,))

        if not row:
            return error("Result not found", 404)

        if row["user_id"] != request.user_id and request.user_role != "admin":
            return error("Not allowed to view this result", 403)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load result", 500, details=str(exc))


# =========================================================
# CREATE RESULT (admin)
# =========================================================

@results_bp.route("", methods=["POST"])
@admin_required
def create_result():

    data = get_json()

    user_id = to_int(data.get("user_id"))
    subject = (data.get("subject") or "").strip()

    if not user_id:
        return error("user_id is required", 400)

    if not subject:
        return error("subject is required", 400)

    marks = to_int(data.get("marks"))
    max_marks = to_int(data.get("max_marks")) or 100

    grade = data.get("grade")

    if not grade and marks is not None:
        grade = _grade_from_percentage((marks / max_marks) * 100)

    try:
        new_id = execute(
            "INSERT INTO results "
            "(user_id, course_code, subject, semester, marks, max_marks, grade, result_status) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (
                user_id,
                data.get("course_code"),
                subject,
                data.get("semester"),
                marks,
                max_marks,
                grade,
                data.get("result_status", "Published")
            ),
            return_id=True
        )

        row = query_one(RESULT_SELECT + " WHERE r.id = %s", (new_id,))

        return success(row, message="Result created", status=201)

    except mysql.connector.Error as exc:
        return error("Could not create result", 500, details=str(exc))


# =========================================================
# UPDATE RESULT (admin)
# =========================================================

@results_bp.route("/<int:result_id>", methods=["PUT"])
@admin_required
def update_result(result_id):

    if not query_one("SELECT id FROM results WHERE id = %s", (result_id,)):
        return error("Result not found", 404)

    data = get_json()

    fields = {}

    for key in ("course_code", "subject", "semester", "grade", "result_status"):
        if key in data:
            fields[key] = data[key]

    for key in ("marks", "max_marks"):
        if key in data:
            fields[key] = to_int(data[key])

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE results SET {set_clause} WHERE id = %s",
            (*fields.values(), result_id)
        )

        row = query_one(RESULT_SELECT + " WHERE r.id = %s", (result_id,))

        return success(row, message="Result updated")

    except mysql.connector.Error as exc:
        return error("Could not update result", 500, details=str(exc))


# =========================================================
# DELETE RESULT (admin)
# =========================================================

@results_bp.route("/<int:result_id>", methods=["DELETE"])
@admin_required
def delete_result(result_id):

    if not query_one("SELECT id FROM results WHERE id = %s", (result_id,)):
        return error("Result not found", 404)

    try:
        execute("DELETE FROM results WHERE id = %s", (result_id,))
        return success(message="Result deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete result", 500, details=str(exc))
