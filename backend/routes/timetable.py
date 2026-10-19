# =========================================================
# TIMETABLE ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required
from utils.validators import parse_time, to_int, one_of

timetable_bp = Blueprint(
    "timetable",
    __name__,
    url_prefix="/api/timetable"
)

DAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")

TIMETABLE_SELECT = (
    "SELECT t.id, t.user_id, t.course_id, c.course_name, c.course_code, "
    "t.day, t.start_time, t.end_time, t.room, t.faculty_name, t.created_at "
    "FROM timetable t LEFT JOIN courses c ON t.course_id = c.id"
)


# =========================================================
# LIST MY TIMETABLE
# =========================================================

@timetable_bp.route("", methods=["GET"])
@token_required
def list_timetable():

    day = request.args.get("day")

    query = TIMETABLE_SELECT + " WHERE t.user_id = %s"
    params = [request.user_id]

    if day:
        query += " AND t.day = %s"
        params.append(day)

    query += (
        " ORDER BY FIELD(t.day, 'Monday','Tuesday','Wednesday','Thursday',"
        "'Friday','Saturday','Sunday'), t.start_time"
    )

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load timetable", 500, details=str(exc))


# =========================================================
# GET ONE TIMETABLE ENTRY
# =========================================================

@timetable_bp.route("/<int:entry_id>", methods=["GET"])
@token_required
def get_entry(entry_id):

    try:
        row = query_one(TIMETABLE_SELECT + " WHERE t.id = %s", (entry_id,))

        if not row:
            return error("Timetable entry not found", 404)

        if row["user_id"] != request.user_id and request.user_role != "admin":
            return error("Not allowed to view this entry", 403)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load timetable entry", 500, details=str(exc))


# =========================================================
# CREATE TIMETABLE ENTRY
# =========================================================

@timetable_bp.route("", methods=["POST"])
@admin_required
def create_entry():

    data = get_json()

    target_user = to_int(data.get("user_id")) or request.user_id

    if target_user != request.user_id and request.user_role != "admin":
        return error("Not allowed to create an entry for another user", 403)

    day = data.get("day")

    if not one_of(day, DAYS):
        return error("A valid day is required", 400)

    start_time = parse_time(data.get("start_time"))
    end_time = parse_time(data.get("end_time"))

    if not start_time or not end_time:
        return error("Valid start_time and end_time are required (HH:MM)", 400)

    if end_time <= start_time:
        return error("end_time must be after start_time", 400)

    course_id = to_int(data.get("course_id"))
    room = data.get("room")
    faculty_name = data.get("faculty_name")

    try:
        new_id = execute(
            "INSERT INTO timetable "
            "(user_id, course_id, day, start_time, end_time, room, faculty_name) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (target_user, course_id, day, start_time, end_time, room, faculty_name),
            return_id=True
        )

        row = query_one(TIMETABLE_SELECT + " WHERE t.id = %s", (new_id,))

        return success(row, message="Timetable entry created", status=201)

    except mysql.connector.Error as exc:
        return error("Could not create timetable entry", 500, details=str(exc))


# =========================================================
# UPDATE TIMETABLE ENTRY
# =========================================================

@timetable_bp.route("/<int:entry_id>", methods=["PUT"])
@admin_required
def update_entry(entry_id):

    existing = query_one(
        "SELECT user_id FROM timetable WHERE id = %s", (entry_id,)
    )

    if not existing:
        return error("Timetable entry not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to update this entry", 403)

    data = get_json()

    fields = {}

    if "day" in data:
        if not one_of(data["day"], DAYS):
            return error("Invalid day", 400)
        fields["day"] = data["day"]

    if "start_time" in data:
        parsed = parse_time(data["start_time"])
        if not parsed:
            return error("start_time must be HH:MM", 400)
        fields["start_time"] = parsed

    if "end_time" in data:
        parsed = parse_time(data["end_time"])
        if not parsed:
            return error("end_time must be HH:MM", 400)
        fields["end_time"] = parsed

    if "course_id" in data:
        fields["course_id"] = to_int(data["course_id"])

    if "room" in data:
        fields["room"] = data["room"]

    if "faculty_name" in data:
        fields["faculty_name"] = data["faculty_name"]

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE timetable SET {set_clause} WHERE id = %s",
            (*fields.values(), entry_id)
        )

        row = query_one(TIMETABLE_SELECT + " WHERE t.id = %s", (entry_id,))

        return success(row, message="Timetable entry updated")

    except mysql.connector.Error as exc:
        return error("Could not update timetable entry", 500, details=str(exc))


# =========================================================
# DELETE TIMETABLE ENTRY
# =========================================================

@timetable_bp.route("/<int:entry_id>", methods=["DELETE"])
@admin_required
def delete_entry(entry_id):

    existing = query_one(
        "SELECT user_id FROM timetable WHERE id = %s", (entry_id,)
    )

    if not existing:
        return error("Timetable entry not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to delete this entry", 403)

    try:
        execute("DELETE FROM timetable WHERE id = %s", (entry_id,))
        return success(message="Timetable entry deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete timetable entry", 500, details=str(exc))
