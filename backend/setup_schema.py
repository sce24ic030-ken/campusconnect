# =========================================================
# CAMPUSCONNECT — SCHEMA SETUP
#
# Creates every table in the database named by DB_NAME and
# reports what it found.
#
#   python setup_schema.py
#
# Works against a local MySQL and against a managed host such
# as Aiven:
#   * connection settings (port, TLS) come from database/db.py
#   * the database is only created when we own it locally
#   * CREATE DATABASE / USE statements in schema.sql are skipped,
#     so the same schema file works everywhere
# =========================================================

import os
import sys

import mysql.connector
from dotenv import load_dotenv

from database.db import (
    create_database,
    get_connection,
    should_create_database,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)

SCHEMA_FILE = os.path.join(BASE_DIR, "database", "schema.sql")

# Statements that the app must not run against a managed database.
SKIPPED_PREFIXES = (
    "CREATE DATABASE",
    "DROP DATABASE",
    "USE ",
    "SHOW TABLES",
)


def strip_leading_comments(text):
    """Drop leading blank/`--` lines from a statement chunk."""

    lines = text.splitlines()

    while lines:
        head = lines[0].strip()
        if not head or head.startswith("--"):
            lines.pop(0)
        else:
            break

    return "\n".join(lines).strip()


def load_statements():
    """Read schema.sql and return the statements we should run."""

    with open(SCHEMA_FILE, "r", encoding="utf-8") as handle:
        schema = handle.read()

    statements = []

    for chunk in schema.split(";"):
        statement = strip_leading_comments(chunk)

        if not statement:
            continue

        if statement.upper().startswith(SKIPPED_PREFIXES):
            continue

        statements.append(statement)

    return statements


def main():
    db_name = os.getenv("DB_NAME", "campusconnect")
    db_host = os.getenv("DB_HOST", "localhost")

    print("========================================")
    print(" CampusConnect schema setup")
    print(" host : {}".format(db_host))
    print(" db   : {}".format(db_name))
    print("========================================\n")

    if should_create_database():
        print("Creating the database (local host)...")
        create_database()
    else:
        print("Managed host: using the existing database.")

    connection = get_connection()
    cursor = connection.cursor()

    try:
        statements = load_statements()
        print("Running {} statement(s)...\n".format(len(statements)))

        for statement in statements:
            try:
                cursor.execute(statement)

                # Consume any rows a statement happens to return.
                if cursor.with_rows:
                    cursor.fetchall()

            except mysql.connector.Error as error:
                print("\nSQL ERROR:")
                print(error)
                print("\nStatement:")
                print(statement[:300])
                connection.rollback()
                raise

        connection.commit()

        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()

        print("========================================")
        print(" CampusConnect database setup successful!")
        print("========================================")
        print("\nTables created:")

        for table in tables:
            print(" -", table[0])

        print("\n{} table(s) ready.".format(len(tables)))

    finally:
        cursor.close()
        connection.close()

    print("\nMySQL connection closed.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - top-level CLI reporting
        print("\nSetup failed: {}".format(exc))
        sys.exit(1)
