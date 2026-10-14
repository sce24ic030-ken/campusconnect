# =========================================================
# INPUT VALIDATION HELPERS
# =========================================================

from datetime import datetime


def parse_date(value):
    """Return a datetime.date from 'YYYY-MM-DD', or None."""

    if value is None or value == "":
        return None

    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()

    except (ValueError, TypeError):
        return None


def parse_time(value):
    """Return a datetime.time from 'HH:MM' or 'HH:MM:SS', or None."""

    if value is None or value == "":
        return None

    for fmt in ("%H:%M:%S", "%H:%M"):

        try:
            return datetime.strptime(str(value), fmt).time()

        except (ValueError, TypeError):
            continue

    return None


def to_int(value):
    """Return an int, or None when the value is not a valid integer."""

    try:
        return int(value)

    except (ValueError, TypeError):
        return None


def one_of(value, allowed):
    """Return True when value is one of the allowed options."""

    return value in allowed
