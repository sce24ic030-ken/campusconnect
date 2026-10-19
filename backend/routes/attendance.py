# =========================================================
# ATTENDANCE ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required
from utils.validators import parse_date, to_int, one_of

attendance_bp = Blueprint(
    "attendance",
    __name__,
    url_prefix="/api/attendance"
)

STATUSES = ("Present", "Absent", "Late")

ATTENDANCE_SELECT = (
    "SELECT a.id, a.user_id, a.course_id, c.course_name, c.course_code, "
    "a.attendance_date, a.status, a.created_at "
    "FROM attendance a LEFT JOIN courses c ON a.course_id = c.id"
)


# =========================================================
# LIST MY ATTENDANCE
# =========================================================

@attendance_bp.route("", methods=["GET"])
@token_required
def list_attendance():

    course_id = to_int(request.args.get("course_id"))
    status = request.args.get("status")
    from_date = parse_date(request.args.get("from"))
    to_date = parse_date(request.args.get("to"))

    query = ATTENDANCE_SELECT + " WHERE a.user_id = %s"
    params = [request.user_id]

    if course_id is not None:
        query += " AND a.course_id = %s"
        params.append(course_id)

    if status:
        query += " AND a.status = %s"
        params.append(status)

    if from_date:
        query += " AND a.attendance_date >= %s"
        params.append(from_date)

    if to_date:
        query += " AND a.attendance_date <= %s"
        params.append(to_date)

    query += " ORDER BY a.attendance_date DESC, a.id DESC"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load attendance", 500, details=str(exc))


# =========================================================
# ATTENDANCE SUMMARY (percentage per course)
# =========================================================

@attendance_bp.route("/summary", methods=["GET"])
@token_required
def attendance_summary():

    query = (
        "SELECT a.course_id, c.course_name, c.course_code, "
        "COUNT(*) AS total, "
        "SUM(a.status = 'Present') AS present, "
        "SUM(a.status = 'Absent') AS absent, "
        "SUM(a.status = 'Late') AS late, "
        "ROUND(SUM(a.status IN ('Present', 'Late')) / COUNT(*) * 100, 2) AS percentage "
        "FROM attendance a LEFT JOIN courses c ON a.course_id = c.id "
        "WHERE a.user_id = %s "
        "GROUP BY a.course_id, c.course_name, c.course_code"
    )

    try:
        rows = query_all(query, (request.user_id,))

        overall = None
        query_overall = (
            "SELECT COUNT(*) AS total, "
            "ROUND(SUM(status IN ('Present', 'Late')) / COUNT(*) * 100, 2) AS percentage "
            "FROM attendance WHERE user_id = %s"
        )
        overall = query_one(query_overall, (request.user_id,))

        return success({
            "overall": overall,
            "by_course": rows
        })

    except mysql.connector.Error as exc:
        return error("Could not build attendance summary", 500, details=str(exc))


# =========================================================
# GET ONE ATTENDANCE RECORD
# =========================================================

@attendance_bp.route("/<int:record_id>", methods=["GET"])
@token_required
def get_attendance(record_id):

    try:
        row = query_one(ATTENDANCE_SELECT + " WHERE a.id = %s", (record_id,))

        if not row:
            return error("Attendance record not found", 404)

        if row["user_id"] != request.user_id and request.user_role != "admin":
            return error("Not allowed to view this record", 403)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load attendance record", 500, details=str(exc))


# =========================================================
# CREATE ATTENDANCE RECORD
# =========================================================

@attendance_bp.route("", methods=["POST"])
@admin_required
def create_attendance():

    data = get_json()

    target_user = to_int(data.get("user_id")) or request.user_id

    if target_user != request.user_id and request.user_role != "admin":
        return error("Not allowed to record attendance for another user", 403)

    attendance_date = parse_date(data.get("attendance_date"))

    if not attendance_date:
        return error("A valid attendance_date (YYYY-MM-DD) is required", 400)

    status = data.get("status", "Present")

    if not one_of(status, STATUSES):
        return error("Status must be Present, Absent or Late", 400)

    course_id = to_int(data.get("course_id"))

    try:
        new_id = execute(
            "INSERT INTO attendance (user_id, course_id, attendance_date, status) "
            "VALUES (%s, %s, %s, %s)",
            (target_user, course_id, attendance_date, status),
            return_id=True
        )

        row = query_one(ATTENDANCE_SELECT + " WHERE a.id = %s", (new_id,))

        return success(row, message="Attendance recorded", status=201)

    except mysql.connector.Error as exc:
        return error("Could not record attendance", 500, details=str(exc))


# =========================================================
# UPDATE ATTENDANCE RECORD
# =========================================================

@attendance_bp.route("/<int:record_id>", methods=["PUT"])
@admin_required
def update_attendance(record_id):

    existing = query_one(
        "SELECT user_id FROM attendance WHERE id = %s", (record_id,)
    )

    if not existing:
        return error("Attendance record not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to update this record", 403)

    data = get_json()

    fields = {}

    if "status" in data:
        if not one_of(data["status"], STATUSES):
            return error("Status must be Present, Absent or Late", 400)
        fields["status"] = data["status"]

    if "course_id" in data:
        fields["course_id"] = to_int(data["course_id"])

    if "attendance_date" in data:
        parsed = parse_date(data["attendance_date"])
        if not parsed:
            return error("attendance_date must be YYYY-MM-DD", 400)
        fields["attendance_date"] = parsed

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE attendance SET {set_clause} WHERE id = %s",
            (*fields.values(), record_id)
        )

        row = query_one(ATTENDANCE_SELECT + " WHERE a.id = %s", (record_id,))

        return success(row, message="Attendance updated")

    except mysql.connector.Error as exc:
        return error("Could not update attendance", 500, details=str(exc))


# =========================================================
# DELETE ATTENDANCE RECORD
# =========================================================

@attendance_bp.route("/<int:record_id>", methods=["DELETE"])
@admin_required
def delete_attendance(record_id):

    existing = query_one(
        "SELECT user_id FROM attendance WHERE id = %s", (record_id,)
    )

    if not existing:
        return error("Attendance record not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to delete this record", 403)

    try:
        execute("DELETE FROM attendance WHERE id = %s", (record_id,))
        return success(message="Attendance record deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete attendance record", 500, details=str(exc))
