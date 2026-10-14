# =========================================================
# FEEDBACK ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required
from utils.validators import to_int

feedback_bp = Blueprint(
    "feedback",
    __name__,
    url_prefix="/api/feedback"
)

FEEDBACK_SELECT = (
    "SELECT f.id, f.user_id, u.name AS student_name, f.rating, "
    "f.message, f.created_at "
    "FROM feedback f LEFT JOIN users u ON f.user_id = u.id"
)


# =========================================================
# SUBMIT FEEDBACK
# =========================================================

@feedback_bp.route("", methods=["POST"])
@token_required
def create_feedback():

    data = get_json()

    rating = to_int(data.get("rating"))

    if rating is None or rating < 1 or rating > 5:
        return error("rating must be an integer between 1 and 5", 400)

    try:
        new_id = execute(
            "INSERT INTO feedback (user_id, rating, message) "
            "VALUES (%s, %s, %s)",
            (request.user_id, rating, data.get("message")),
            return_id=True
        )

        row = query_one(FEEDBACK_SELECT + " WHERE f.id = %s", (new_id,))

        return success(row, message="Thank you for your feedback", status=201)

    except mysql.connector.Error as exc:
        return error("Could not submit feedback", 500, details=str(exc))


# =========================================================
# LIST MY FEEDBACK
# =========================================================

@feedback_bp.route("", methods=["GET"])
@token_required
def list_my_feedback():

    try:
        rows = query_all(
            FEEDBACK_SELECT + " WHERE f.user_id = %s ORDER BY f.created_at DESC",
            (request.user_id,)
        )

        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load feedback", 500, details=str(exc))


# =========================================================
# FEEDBACK SUMMARY (admin)
# =========================================================

@feedback_bp.route("/summary", methods=["GET"])
@admin_required
def feedback_summary():

    try:
        summary = query_one(
            "SELECT COUNT(*) AS total, ROUND(AVG(rating), 2) AS average_rating "
            "FROM feedback"
        )

        recent = query_all(
            FEEDBACK_SELECT + " ORDER BY f.created_at DESC, f.id DESC LIMIT 20"
        )

        return success({
            "total": summary["total"],
            "average_rating": summary["average_rating"],
            "recent": recent
        })

    except mysql.connector.Error as exc:
        return error("Could not build feedback summary", 500, details=str(exc))
