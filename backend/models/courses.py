# =========================================================
# COURSES MODEL (DATA ACCESS LAYER)
# Raw SQL via mysql-connector-python (no ORM).
# =========================================================

from database.db import get_connection


# =========================================================
# GET ALL COURSES (optional filters)
# =========================================================

def get_all_courses(program=None, semester=None):
    """Return every course, optionally filtered by program/semester."""

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        query = "SELECT * FROM courses WHERE 1=1"
        params = []

        if program:
            query += " AND program = %s"
            params.append(str(program).upper())

        if semester is not None:
            query += " AND semester = %s"
            params.append(semester)

        query += " ORDER BY program, semester, course_name"

        cursor.execute(query, params)

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()


# =========================================================
# GET ONE COURSE BY ID
# =========================================================

def get_course_by_id(course_id):
    """Return a single course row, or None if it does not exist."""

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM courses WHERE id = %s",
            (course_id,)
        )

        return cursor.fetchone()

    finally:
        cursor.close()
        connection.close()
