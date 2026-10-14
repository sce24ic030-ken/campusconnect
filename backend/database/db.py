import mysql.connector
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)


def create_database():
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

    cursor = connection.cursor()

    cursor.execute(
        "CREATE DATABASE IF NOT EXISTS campusconnect"
    )

    cursor.close()
    connection.close()

    print("Database checked successfully!")


def get_connection():
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

    return connection


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
    create_database()

    connection = get_connection()

    print("MySQL connected successfully!")

    connection.close()