# =========================================================
# COURSES ROUTES
# =========================================================

from flask import Blueprint, jsonify, request
import mysql.connector

from models.courses import get_all_courses, get_course_by_id

courses_bp = Blueprint(
    "courses",
    __name__,
    url_prefix="/api/courses"
)


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
