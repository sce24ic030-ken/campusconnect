# =========================================================
# LIBRARY / DOCUMENTS ROUTES
# =========================================================

import os

from flask import Blueprint, request, current_app
from werkzeug.utils import secure_filename
import mysql.connector

from database.db import query_all, query_one, execute
from utils.helpers import success, error, get_json
from utils.security import token_required, admin_required

library_bp = Blueprint(
    "library",
    __name__,
    url_prefix="/api/library"
)

DOCUMENT_SELECT = (
    "SELECT id, user_id, document_name, document_type, file_path, uploaded_at "
    "FROM documents"
)

ALLOWED_EXTENSIONS = {
    "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
    "txt", "png", "jpg", "jpeg", "zip"
}


def _uploads_dir(user_id):
    """Return (and create) the upload directory for a user."""

    base = os.path.join(current_app.root_path, "uploads", f"user_{user_id}")
    os.makedirs(base, exist_ok=True)
    return base


def _allowed(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# =========================================================
# LIST MY DOCUMENTS
# =========================================================

@library_bp.route("/documents", methods=["GET"])
@token_required
def list_documents():

    try:
        rows = query_all(
            DOCUMENT_SELECT + " WHERE user_id = %s ORDER BY uploaded_at DESC",
            (request.user_id,)
        )

        return success(rows)

    except mysql.connector.Error as exc:
        return error("Could not load documents", 500, details=str(exc))


# =========================================================
# GET ONE DOCUMENT
# =========================================================

@library_bp.route("/documents/<int:document_id>", methods=["GET"])
@token_required
def get_document(document_id):

    try:
        row = query_one(DOCUMENT_SELECT + " WHERE id = %s", (document_id,))

        if not row:
            return error("Document not found", 404)

        if row["user_id"] != request.user_id and request.user_role != "admin":
            return error("Not allowed to view this document", 403)

        return success(row)

    except mysql.connector.Error as exc:
        return error("Could not load document", 500, details=str(exc))


# =========================================================
# ADD A DOCUMENT (metadata + optional file upload)
# =========================================================

@library_bp.route("/documents", methods=["POST"])
@token_required
def add_document():

    # Support both JSON metadata and multipart form uploads.
    if request.content_type and "multipart/form-data" in request.content_type:
        form = request.form
        document_name = (form.get("document_name") or "").strip()
        document_type = form.get("document_type")
    else:
        data = get_json()
        form = data
        document_name = (data.get("document_name") or "").strip()
        document_type = data.get("document_type")

    if not document_name:
        return error("document_name is required", 400)

    file_path = form.get("file_path")

    upload = request.files.get("file")

    if upload and upload.filename:
        if not _allowed(upload.filename):
            return error("This file type is not allowed", 400)

        safe_name = secure_filename(upload.filename)
        folder = _uploads_dir(request.user_id)
        absolute = os.path.join(folder, safe_name)
        upload.save(absolute)

        # Store a relative path so it is portable across machines.
        file_path = os.path.join(
            "uploads", f"user_{request.user_id}", safe_name
        )

    try:
        new_id = execute(
            "INSERT INTO documents "
            "(user_id, document_name, document_type, file_path) "
            "VALUES (%s, %s, %s, %s)",
            (request.user_id, document_name, document_type, file_path),
            return_id=True
        )

        row = query_one(DOCUMENT_SELECT + " WHERE id = %s", (new_id,))

        return success(row, message="Document added", status=201)

    except mysql.connector.Error as exc:
        return error("Could not add document", 500, details=str(exc))


# =========================================================
# DELETE DOCUMENT
# =========================================================

@library_bp.route("/documents/<int:document_id>", methods=["DELETE"])
@admin_required
def delete_document(document_id):

    existing = query_one(
        "SELECT user_id, file_path FROM documents WHERE id = %s", (document_id,)
    )

    if not existing:
        return error("Document not found", 404)

    if existing["user_id"] != request.user_id and request.user_role != "admin":
        return error("Not allowed to delete this document", 403)

    try:
        execute("DELETE FROM documents WHERE id = %s", (document_id,))

        # Best-effort removal of the stored file.
        if existing.get("file_path"):
            absolute = os.path.join(current_app.root_path, existing["file_path"])
            if os.path.isfile(absolute):
                try:
                    os.remove(absolute)
                except OSError:
                    pass

        return success(message="Document deleted")

    except mysql.connector.Error as exc:
        return error("Could not delete document", 500, details=str(exc))
