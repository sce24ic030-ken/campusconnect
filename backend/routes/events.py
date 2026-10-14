# =========================================================
# EVENTS ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required
from utils.validators import parse_date, parse_time, to_int

events_bp = Blueprint(
    "events",
    __name__,
    url_prefix="/api/events"
)

EVENT_SELECT = (
    "SELECT id, title, description, event_date, start_time, end_time, "
    "location, category, image, created_at FROM events"
)


# =========================================================
# LIST EVENTS (public)
# =========================================================

@events_bp.route("", methods=["GET"])
def list_events():

    category = request.args.get("category")
    upcoming = request.args.get("upcoming") in ("1", "true", "True")

    query = EVENT_SELECT + " WHERE 1=1"
    params = []

    if category:
        query += " AND category = %s"
        params.append(category)

    if upcoming:
        query += " AND (event_date IS NULL OR event_date >= CURDATE())"

    query += " ORDER BY event_date IS NULL, event_date ASC, start_time ASC"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load events", 500, details=str(exc))


# =========================================================
# GET ONE EVENT (public)
# =========================================================

@events_bp.route("/<int:event_id>", methods=["GET"])
def get_event(event_id):

    try:
        row = query_one(EVENT_SELECT + " WHERE id = %s", (event_id,))

        if not row:
            return error("Event not found", 404)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load event", 500, details=str(exc))


# =========================================================
# CREATE EVENT (admin)
# =========================================================

@events_bp.route("", methods=["POST"])
@admin_required
def create_event():

    data = get_json()

    title = (data.get("title") or "").strip()

    if not title:
        return error("A title is required", 400)

    event_date = parse_date(data.get("event_date"))

    if data.get("event_date") and not event_date:
        return error("event_date must be YYYY-MM-DD", 400)

    try:
        new_id = execute(
            "INSERT INTO events "
            "(title, description, event_date, start_time, end_time, location, category, image) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (
                title,
                data.get("description"),
                event_date,
                parse_time(data.get("start_time")),
                parse_time(data.get("end_time")),
                data.get("location"),
                data.get("category"),
                data.get("image")
            ),
            return_id=True
        )

        row = query_one(EVENT_SELECT + " WHERE id = %s", (new_id,))

        return success(row, message="Event created", status=201)

    except mysql.connector.Error as exc:
        return error("Could not create event", 500, details=str(exc))


# =========================================================
# UPDATE EVENT (admin)
# =========================================================

@events_bp.route("/<int:event_id>", methods=["PUT"])
@admin_required
def update_event(event_id):

    if not query_one("SELECT id FROM events WHERE id = %s", (event_id,)):
        return error("Event not found", 404)

    data = get_json()

    fields = {}

    for key in ("title", "description", "location", "category", "image"):
        if key in data:
            fields[key] = data[key]

    if "event_date" in data:
        parsed = parse_date(data["event_date"])
        if data["event_date"] and not parsed:
            return error("event_date must be YYYY-MM-DD", 400)
        fields["event_date"] = parsed

    for key in ("start_time", "end_time"):
        if key in data:
            parsed = parse_time(data[key])
            if data[key] and not parsed:
                return error(f"{key} must be HH:MM", 400)
            fields[key] = parsed

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE events SET {set_clause} WHERE id = %s",
            (*fields.values(), event_id)
        )

        row = query_one(EVENT_SELECT + " WHERE id = %s", (event_id,))

        return success(row, message="Event updated")

    except mysql.connector.Error as exc:
        return error("Could not update event", 500, details=str(exc))


# =========================================================
# DELETE EVENT (admin)
# =========================================================

@events_bp.route("/<int:event_id>", methods=["DELETE"])
@admin_required
def delete_event(event_id):

    if not query_one("SELECT id FROM events WHERE id = %s", (event_id,)):
        return error("Event not found", 404)

    try:
        execute("DELETE FROM events WHERE id = %s", (event_id,))
        return success(message="Event deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete event", 500, details=str(exc))
