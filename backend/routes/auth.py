from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import get_connection
from utils.security import generate_token

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# =========================================================
# REGISTER
# =========================================================

@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No data received"
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    student_id = data.get("student_id", "").strip()
    course = data.get("course", "").strip()
    semester = data.get("semester")
    phone = data.get("phone", "").strip()
    password = data.get("password", "")

    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email and password are required"
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        # -------------------------------------------------
        # CHECK EMAIL
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        existing_email = cursor.fetchone()

        if existing_email:
            return jsonify({
                "success": False,
                "message": "Email already registered"
            }), 409

        # -------------------------------------------------
        # CHECK STUDENT ID
        # -------------------------------------------------

        if student_id:

            cursor.execute(
                """
                SELECT id
                FROM users
                WHERE student_id = %s
                """,
                (student_id,)
            )

            existing_student = cursor.fetchone()

            if existing_student:
                return jsonify({
                    "success": False,
                    "message": "Student ID already registered"
                }), 409

        # -------------------------------------------------
        # HASH PASSWORD
        # -------------------------------------------------

        hashed_password = generate_password_hash(password)

        # -------------------------------------------------
        # INSERT USER
        # -------------------------------------------------

        cursor.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                password,
                student_id,
                course,
                semester,
                phone
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                name,
                email,
                hashed_password,
                student_id if student_id else None,
                course if course else None,
                semester if semester else None,
                phone if phone else None
            )
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Registration successful"
        }), 201

    except Exception as e:

        if connection:
            connection.rollback()

        print("REGISTER ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Registration failed"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================================
# LOGIN
# =========================================================

@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No data received"
        }), 400

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                id,
                name,
                email,
                password,
                student_id,
                course,
                semester,
                phone,
                role,
                profile_image
            FROM users
            WHERE email = %s OR student_id = %s
            """,
            (email, email)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        if not check_password_hash(user["password"], password):
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        # Never send password to frontend
        user.pop("password", None)

        # Issue a JWT for this session
        token = generate_token(
            user["id"],
            email=user["email"],
            role=user.get("role", "student")
        )

        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": user
        }), 200

    except Exception as e:

        print("LOGIN ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Login failed"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()