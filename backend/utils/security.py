# =========================================================
# SECURITY / AUTHENTICATION HELPERS (JWT)
# =========================================================

from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, request

from utils.helpers import error


# =========================================================
# TOKEN CREATION
# =========================================================

def generate_token(user_id, email=None, role="student"):
    """Create a signed JWT for the given user."""

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(
            hours=current_app.config.get("JWT_EXPIRY_HOURS", 24)
        )
    }

    return jwt.encode(
        payload,
        current_app.config["JWT_SECRET"],
        algorithm=current_app.config.get("JWT_ALGORITHM", "HS256")
    )


# =========================================================
# TOKEN DECODING
# =========================================================

def decode_token(token):
    """Decode and validate a JWT. Raises jwt exceptions on failure."""

    return jwt.decode(
        token,
        current_app.config["JWT_SECRET"],
        algorithms=[current_app.config.get("JWT_ALGORITHM", "HS256")]
    )


def _extract_token():
    """Read the bearer token from the Authorization header."""

    header = request.headers.get("Authorization", "")

    if not header.startswith("Bearer "):
        return None

    return header.split(" ", 1)[1].strip()


# =========================================================
# DECORATORS
# =========================================================

def token_required(view):
    """Require a valid JWT. Sets request.user_id and request.user_role."""

    @wraps(view)
    def wrapper(*args, **kwargs):

        token = _extract_token()

        if not token:
            return error("Authorization token is missing", 401)

        try:
            payload = decode_token(token)

        except jwt.ExpiredSignatureError:
            return error("Token has expired. Please log in again.", 401)

        except jwt.InvalidTokenError:
            return error("Invalid authentication token", 401)

        request.user_id = int(payload["sub"])
        request.user_role = payload.get("role", "student")

        return view(*args, **kwargs)

    return wrapper


def optional_token(view):
    """Try to decode a token if present. If present & valid -> set
    request.user_id and request.user_role; otherwise -> set both to None.
    This is safe for guest access to public endpoints (e.g., chatbot).
    """

    @wraps(view)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        if token:
            try:
                payload = decode_token(token)
                request.user_id = int(payload["sub"])
                request.user_role = payload.get("role", "student")
                return view(*args, **kwargs)
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError, KeyError):
                pass

        request.user_id = None
        request.user_role = None
        return view(*args, **kwargs)

    return wrapper


def admin_required(view):
    """Require a valid JWT belonging to an admin user."""

    @wraps(view)
    @token_required
    def wrapper(*args, **kwargs):

        if request.user_role != "admin":
            return error("Administrator access required", 403)

        return view(*args, **kwargs)

    return wrapper
