# =========================================================
# ACADEMICS / DASHBOARD ROUTES
# Aggregated information used by the student dashboard.
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_one, query_all
from utils.helpers import success, error
from utils.security import token_required
from services.reminder_service import upcoming_assignments, upcoming_exams

academics_bp = Blueprint(
    "academics",
    __name__,
    url_prefix="/api/academics"
)


# =========================================================
# DASHBOARD OVERVIEW
# =========================================================

@academics_bp.route("/overview", methods=["GET"])
@token_required
def overview():

    try:
        course_count = query_one("SELECT COUNT(*) AS total FROM courses")

        attendance = query_one(
            "SELECT COUNT(*) AS total, "
            "ROUND(SUM(status IN ('Present', 'Late')) / COUNT(*) * 100, 2) AS percentage "
            "FROM attendance WHERE user_id = %s",
            (request.user_id,)
        )

        pending_assignments = query_one(
            "SELECT COUNT(*) AS total FROM assignments "
            "WHERE user_id = %s AND status <> 'Submitted'",
            (request.user_id,)
        )

        unread = query_one(
            "SELECT COUNT(*) AS total FROM notifications "
            "WHERE user_id = %s AND is_read = 0",
            (request.user_id,)
        )

        return success({
            "total_courses": course_count["total"],
            "attendance": attendance,
            "pending_assignments": pending_assignments["total"],
            "unread_notifications": unread["total"],
            "upcoming_assignments": upcoming_assignments(request.user_id, 7),
            "upcoming_exams": upcoming_exams(request.user_id, 14)
        })

    except mysql.connector.Error as exc:
        return error("Could not build overview", 500, details=str(exc))
