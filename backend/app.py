# =========================================================
# CAMPUSCONNECT BACKEND
# Flask application entry point
# =========================================================

from datetime import date, datetime, time, timedelta
from decimal import Decimal

from flask import Flask, jsonify
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS

from config import get_config

# ---------------------------------------------------------
# BLUEPRINTS
# ---------------------------------------------------------
from routes.auth import auth_bp
from routes.courses import courses_bp
from routes.students import students_bp
from routes.settings import settings_bp
from routes.attendance import attendance_bp
from routes.timetable import timetable_bp
from routes.assignments import assignments_bp
from routes.exams import exams_bp
from routes.results import results_bp
from routes.events import events_bp
from routes.faculty import faculty_bp
from routes.campus import campus_bp
from routes.placement import placement_bp
from routes.applications import applications_bp
from routes.notifications import notifications_bp
from routes.library import library_bp
from routes.lost_found import lost_found_bp
from routes.complaints import complaints_bp
from routes.feedback import feedback_bp
from routes.admin import admin_bp
from routes.academics import academics_bp
from routes.chatbot import chatbot_bp


# =========================================================
# JSON PROVIDER
# Makes dates, times and timedeltas serialisable.
# =========================================================

class CampusJSONProvider(DefaultJSONProvider):

    def default(self, obj):

        if isinstance(obj, (datetime, date, time)):
            return obj.isoformat()

        if isinstance(obj, timedelta):
            total = int(obj.total_seconds())
            sign = "-" if total < 0 else ""
            total = abs(total)
            return (
                f"{sign}{total // 3600:02d}:"
                f"{(total % 3600) // 60:02d}:{total % 60:02d}"
            )

        if isinstance(obj, Decimal):
            return float(obj)

        return super().default(obj)


# =========================================================
# APPLICATION FACTORY
# =========================================================

def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())

    # Use our custom JSON encoder for dates/times.
    app.json = CampusJSONProvider(app)

    # Allow the (separate) frontend to call this API.
    origins = app.config.get("CORS_ORIGINS", "*")

    if origins == "*":
        CORS(app)
    else:
        CORS(app, origins=[o.strip() for o in origins.split(",") if o.strip()])

    # -----------------------------------------------------
    # REGISTER BLUEPRINTS
    # -----------------------------------------------------
    blueprints = (
        auth_bp,
        courses_bp,
        students_bp,
        settings_bp,
        attendance_bp,
        timetable_bp,
        assignments_bp,
        exams_bp,
        results_bp,
        events_bp,
        faculty_bp,
        campus_bp,
        placement_bp,
        applications_bp,
        notifications_bp,
        library_bp,
        lost_found_bp,
        complaints_bp,
        feedback_bp,
        admin_bp,
        academics_bp,
        chatbot_bp,
    )

    for blueprint in blueprints:
        app.register_blueprint(blueprint)

    # -----------------------------------------------------
    # HOME / HEALTH CHECK
    # -----------------------------------------------------
    @app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "success": True,
            "message": "CampusConnect Backend is running!"
        })

    # -----------------------------------------------------
    # ERROR HANDLERS
    # -----------------------------------------------------
    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({
            "success": False,
            "message": "Resource not found"
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(_error):
        return jsonify({
            "success": False,
            "message": "Method not allowed"
        }), 405

    @app.errorhandler(500)
    def server_error(_error):
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500

    return app


app = create_app()


# =========================================================
# START SERVER (development)
# =========================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=app.config.get("DEBUG", True),
        # The chatbot streams from NVIDIA and can take a while; threading
        # keeps one slow request from blocking every other API call.
        threaded=True
    )
