import mysql.connector
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)


# =========================================================
# CONNECTION SETTINGS
# =========================================================

def _db_settings(include_database=True):
    """Build the mysql.connector kwargs from the environment.

    Handles the three things that differ between a local MySQL and a
    managed one (Aiven, etc.):
      * a non-default port
      * TLS, which managed providers require
      * an optional CA certificate for full verification
    """

    host = os.getenv("DB_HOST", "localhost")

    settings = {
        "host": host,
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        # Don't hang forever if the host is unreachable.
        "connection_timeout": int(os.getenv("DB_CONNECT_TIMEOUT", "20")),
    }

    if include_database:
        settings["database"] = os.getenv("DB_NAME", "campusconnect")

    # ---- TLS -------------------------------------------------
    ca_path = os.getenv("DB_SSL_CA", "").strip()
    ssl_flag = os.getenv("DB_SSL", "").strip().lower()

    if ca_path:
        # Verify the server against the provider's CA certificate.
        settings["ssl_ca"] = ca_path
        settings["ssl_verify_cert"] = True
    elif ssl_flag in ("1", "true", "yes", "on"):
        # Encrypted connection without certificate verification.
        settings["ssl_disabled"] = False
    elif ssl_flag in ("0", "false", "no", "off"):
        settings["ssl_disabled"] = True
    else:
        # Auto: managed hosts get TLS, localhost doesn't.
        if host not in ("localhost", "127.0.0.1", "::1"):
            settings["ssl_disabled"] = False

    return settings


def should_create_database():
    """True when this app is expected to create its own database."""

    flag = os.getenv("DB_SKIP_CREATE", "").strip().lower()

    if flag in ("1", "true", "yes"):
        return False

    if flag in ("0", "false", "no"):
        return True

    # Auto: only local development creates the schema database itself.
    host = os.getenv("DB_HOST", "localhost")

    return host in ("localhost", "127.0.0.1", "::1")


def create_database():
    settings = _db_settings(include_database=False)

    connection = mysql.connector.connect(**settings)

    cursor = connection.cursor()

    db_name = os.getenv("DB_NAME", "campusconnect")

    # Identifier can't be parameterised; restrict it to safe characters.
    safe_name = "".join(ch for ch in db_name if ch.isalnum() or ch == "_")

    cursor.execute(
        "CREATE DATABASE IF NOT EXISTS `{}` "
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci".format(safe_name)
    )

    cursor.close()
    connection.close()

    print("Database checked successfully!")


def get_connection():
    return mysql.connector.connect(**_db_settings(include_database=True))


# =========================================================
# SMALL QUERY HELPERS
# Thin wrappers so route modules stay short and consistent.
# =========================================================

def query_all(sql, params=()):
    """Run a SELECT and return every row as a list of dicts."""

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(sql, params)
        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()


def query_one(sql, params=()):
    """Run a SELECT and return a single row as a dict (or None)."""

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(sql, params)
        return cursor.fetchone()

    finally:
        cursor.close()
        connection.close()


def execute(sql, params=(), return_id=False):
    """Run an INSERT/UPDATE/DELETE and commit.

    Returns the new row id when return_id is True, else the row count.
    """

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(sql, params)
        connection.commit()

        return cursor.lastrowid if return_id else cursor.rowcount

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    if should_create_database():
        create_database()
    else:
        print("Skipping CREATE DATABASE (managed host).")

    connection = get_connection()

    print("MySQL connected successfully!")

    connection.close()