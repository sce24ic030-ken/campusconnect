# =========================================================
# LOST AND FOUND ROUTES
# =========================================================

from flask import Blueprint, request
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required
from utils.validators import parse_date, one_of

lost_found_bp = Blueprint(
    "lost_found",
    __name__,
    url_prefix="/api/lost-found"
)

ITEM_TYPES = ("Lost", "Found")
STATUSES = ("Open", "Claimed", "Closed")

LOST_FOUND_SELECT = (
    "SELECT lf.id, lf.user_id, u.name AS reporter_name, lf.item_name, "
    "lf.description, lf.item_type, lf.location, lf.item_date, lf.status, "
    "lf.contact, lf.created_at "
    "FROM lost_found lf LEFT JOIN users u ON lf.user_id = u.id"
)


# =========================================================
# LIST ITEMS (public)
# =========================================================

@lost_found_bp.route("", methods=["GET"])
def list_items():

    item_type = request.args.get("item_type")
    status = request.args.get("status")
    search = request.args.get("q")

    query = LOST_FOUND_SELECT + " WHERE 1=1"
    params = []

    if item_type:
        query += " AND lf.item_type = %s"
        params.append(item_type)

    if status:
        query += " AND lf.status = %s"
        params.append(status)

    if search:
        query += " AND (lf.item_name LIKE %s OR lf.description LIKE %s OR lf.location LIKE %s)"
        like = f"%{search}%"
        params.extend([like, like, like])

    query += " ORDER BY lf.created_at DESC, lf.id DESC"

    try:
        rows = query_all(query, tuple(params))
        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load lost & found items", 500, details=str(exc))


# =========================================================
# GET ONE ITEM (public)
# =========================================================

@lost_found_bp.route("/<int:item_id>", methods=["GET"])
def get_item(item_id):

    try:
        row = query_one(LOST_FOUND_SELECT + " WHERE lf.id = %s", (item_id,))

        if not row:
            return error("Item not found", 404)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load item", 500, details=str(exc))


# =========================================================
# REPORT AN ITEM
# =========================================================

@lost_found_bp.route("", methods=["POST"])
@token_required
def create_item():

    data = get_json()

    item_name = (data.get("item_name") or "").strip()

    if not item_name:
        return error("item_name is required", 400)

    item_type = data.get("item_type", "Lost")

    if not one_of(item_type, ITEM_TYPES):
        return error("item_type must be Lost or Found", 400)

    item_date = parse_date(data.get("item_date"))

    if data.get("item_date") and not item_date:
        return error("item_date must be YYYY-MM-DD", 400)

    status = data.get("status", "Open")

    if not one_of(status, STATUSES):
        return error("Invalid status", 400)

    try:
        new_id = execute(
            "INSERT INTO lost_found "
            "(user_id, item_name, description, item_type, location, item_date, status, contact) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (
                request.user_id,
                item_name,
                data.get("description"),
                item_type,
                data.get("location"),
                item_date,
                status,
                data.get("contact")
            ),
            return_id=True
        )

        row = query_one(LOST_FOUND_SELECT + " WHERE lf.id = %s", (new_id,))

        return success(row, message="Item reported", status=201)

    except mysql.connector.Error as exc:
        return error("Could not report item", 500, details=str(exc))


# =========================================================
# UPDATE ITEM (owner or admin)
# =========================================================

@lost_found_bp.route("/<int:item_id>", methods=["PUT"])
@admin_required
def update_item(item_id):

    existing = query_one(
        "SELECT user_id FROM lost_found WHERE id = %s", (item_id,)
    )

    if not existing:
        return error("Item not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to update this item", 403)

    data = get_json()

    fields = {}

    for key in ("item_name", "description", "location", "contact"):
        if key in data:
            fields[key] = data[key]

    if "item_type" in data:
        if not one_of(data["item_type"], ITEM_TYPES):
            return error("item_type must be Lost or Found", 400)
        fields["item_type"] = data["item_type"]

    if "status" in data:
        if not one_of(data["status"], STATUSES):
            return error("Invalid status", 400)
        fields["status"] = data["status"]

    if "item_date" in data:
        parsed = parse_date(data["item_date"])
        if data["item_date"] and not parsed:
            return error("item_date must be YYYY-MM-DD", 400)
        fields["item_date"] = parsed

    if not fields:
        return error("No valid fields to update", 400)

    set_clause = ", ".join(f"{key} = %s" for key in fields)

    try:
        execute(
            f"UPDATE lost_found SET {set_clause} WHERE id = %s",
            (*fields.values(), item_id)
        )

        row = query_one(LOST_FOUND_SELECT + " WHERE lf.id = %s", (item_id,))

        return success(row, message="Item updated")

    except mysql.connector.Error as exc:
        return error("Could not update item", 500, details=str(exc))


# =========================================================
# DELETE ITEM (owner or admin)
# =========================================================

@lost_found_bp.route("/<int:item_id>", methods=["DELETE"])
@admin_required
def delete_item(item_id):

    existing = query_one(
        "SELECT user_id FROM lost_found WHERE id = %s", (item_id,)
    )

    if not existing:
        return error("Item not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to delete this item", 403)

    try:
        execute("DELETE FROM lost_found WHERE id = %s", (item_id,))
        return success(message="Item deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete item", 500, details=str(exc))
