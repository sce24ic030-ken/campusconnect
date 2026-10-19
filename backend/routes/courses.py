# =========================================================
# COURSES ROUTES
# =========================================================

from flask import Blueprint, jsonify, request
import mysql.connector

from database.db import execute, query_one
from models.courses import get_all_courses, get_course_by_id
from utils.helpers import success, error, get_json
from utils.security import admin_required
from utils.validators import to_int

courses_bp = Blueprint(
    "courses",
    __name__,
    url_prefix="/api/courses"
)

COURSE_COLUMNS = (
    "course_code", "course_name", "program", "semester",
    "credits", "department", "faculty_name", "description"
)


def normalise_program(value):
    """'B.Com', 'bcom' and 'BCOM' all mean the same programme."""

    return "".join(ch for ch in str(value).upper() if ch.isalnum())


# =========================================================
# GET ALL COURSES (filter by program and/or semester)
# =========================================================

@courses_bp.route("", methods=["GET"])
def list_courses():

    program = request.args.get("program")
    semester = request.args.get("semester")

    # Validate the semester filter before hitting the database
    if semester is not None and semester != "":
        try:
            semester = int(semester)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Semester must be a number"
            }), 400
    else:
        semester = None

    try:
        courses = get_all_courses(program=program, semester=semester)
        return jsonify(courses), 200

    except mysql.connector.Error:
        return jsonify({
            "success": False,
            "message": "Could not retrieve courses"
        }), 500


# =========================================================
# GET ONE COURSE BY ID
# =========================================================

@courses_bp.route("/<int:course_id>", methods=["GET"])
def get_course(course_id):

    try:
        course = get_course_by_id(course_id)

        if not course:
            return jsonify({
                "success": False,
                "message": "Course not found"
            }), 404

        return jsonify(course), 200

    except mysql.connector.Error:
        return jsonify({
            "success": False,
            "message": "Could not retrieve course"
        }), 500


# =========================================================
# CREATE COURSE (admin)
# =========================================================

@courses_bp.route("", methods=["POST"])
@admin_required
def create_course():

    data = get_json()

    course_code = (data.get("course_code") or "").strip()
    course_name = (data.get("course_name") or "").strip()
    program = normalise_program(data.get("program") or "")
    semester = to_int(data.get("semester"))
    credits = to_int(data.get("credits"))

    if not course_code or not course_name or not program:
        return error("course_code, course_name and program are required", 400)

    if semester is None or semester < 1:
        return error("semester must be a positive number", 400)

    if data.get("credits") not in (None, "") and (credits is None or credits < 0):
        return error("credits must be a number", 400)

    try:
        new_id = execute(
            "INSERT INTO courses "
            "(course_code, course_name, program, semester, credits, "
            " department, faculty_name, description) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (
                course_code,
                course_name,
                program,
                semester,
                credits if credits is not None else 3,
                data.get("department"),
                data.get("faculty_name"),
                data.get("description")
            ),
            return_id=True
        )

        return success(get_course_by_id(new_id), message="Course created", status=201)

    except mysql.connector.Error as exc:
        if exc.errno == 1062:
            return error("That course code is already in use", 409)

        return error("Could not create course", 500, details=str(exc))


# =========================================================
# UPDATE COURSE (admin)
# =========================================================

@courses_bp.route("/<int:course_id>", methods=["PUT"])
@admin_required
def update_course(course_id):

    if not query_one("SELECT id FROM courses WHERE id = %s", (course_id,)):
        return error("Course not found", 404)

    data = get_json()

    fields = {
        key: data[key]
        for key in COURSE_COLUMNS
        if key in data
    }

    if not fields:
        return error("No valid fields to update", 400)

    if "semester" in fields:
        semester = to_int(fields["semester"])
        if semester is None or semester < 1:
            return error("semester must be a positive number", 400)
        fields["semester"] = semester

    if "credits" in fields and fields["credits"] not in (None, ""):
        credits = to_int(fields["credits"])
        if credits is None or credits < 0:
            return error("credits must be a number", 400)
        fields["credits"] = credits

    if "program" in fields:
        program = normalise_program(fields["program"] or "")
        if not program:
            return error("program cannot be empty", 400)
        fields["program"] = program

    if "course_code" in fields and not (fields["course_code"] or "").strip():
        return error("course_code cannot be empty", 400)

    if "course_name" in fields and not (fields["course_name"] or "").strip():
        return error("course_name cannot be empty", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE courses SET {set_clause} WHERE id = %s",
            (*fields.values(), course_id)
        )

        return success(get_course_by_id(course_id), message="Course updated")

    except mysql.connector.Error as exc:
        if exc.errno == 1062:
            return error("That course code is already in use", 409)

        return error("Could not update course", 500, details=str(exc))


# =========================================================
# DELETE COURSE (admin)
# =========================================================

@courses_bp.route("/<int:course_id>", methods=["DELETE"])
@admin_required
def delete_course(course_id):

    if not query_one("SELECT id FROM courses WHERE id = %s", (course_id,)):
        return error("Course not found", 404)

    try:
        # Assignments and timetable entries point at courses with
        # ON DELETE SET NULL, so removing a course never removes work.
        execute("DELETE FROM courses WHERE id = %s", (course_id,))
        return success(message="Course deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete course", 500, details=str(exc))
