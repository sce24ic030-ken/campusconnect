from flask import Blueprint, request, jsonify
from database.db import get_db_connection

attendance_bp = Blueprint(
    "attendance",
    __name__,
    url_prefix="/api/attendance"
)


# Get attendance for a student
@attendance_bp.route("/student/<int:student_id>", methods=["GET"])
def get_attendance(student_id):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, student_id, course_id, attendance_date, status
        FROM attendance
        WHERE student_id = %s
        ORDER BY attendance_date DESC
    """, (student_id,))

    records = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(records), 200


# Add attendance
@attendance_bp.route("/", methods=["POST"])
def add_attendance():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data provided"
        }), 400

    student_id = data.get("student_id")
    course_id = data.get("course_id")
    attendance_date = data.get("attendance_date")
    status = data.get("status")

    if not student_id or not course_id or not attendance_date or not status:
        return jsonify({
            "error": "student_id, course_id, attendance_date and status are required"
        }), 400

    if status not in ["Present", "Absent", "Late"]:
        return jsonify({
            "error": "Status must be Present, Absent or Late"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO attendance
        (student_id, course_id, attendance_date, status)
        VALUES (%s, %s, %s, %s)
    """, (
        student_id,
        course_id,
        attendance_date,
        status
    ))

    connection.commit()

    attendance_id = cursor.lastrowid

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Attendance added successfully",
        "attendance_id": attendance_id
    }), 201