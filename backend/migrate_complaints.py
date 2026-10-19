"""Idempotent migration: give complaints its category/location/priority
columns. Checks information_schema first, so running it twice (or against
a database that already has them) is a no-op.

  python migrate_complaints.py            # uses DB_* from the environment
  python migrate_complaints.py --env FILE # DB_* read from FILE first

The app's own database.db handles TLS and connection settings, so the same
script works against local MySQL and against Aiven.
"""
import json
import os
import sys

BASE = os.path.dirname(os.path.abspath(__file__))

if "--env" in sys.argv:
    path = sys.argv[sys.argv.index("--env") + 1]
    with open(path, encoding="utf-8") as fh:
        for key, value in json.load(fh).items():
            os.environ[key] = str(value)

from dotenv import load_dotenv  # noqa: E402

load_dotenv(os.path.join(BASE, ".env"))

from database.db import get_connection  # noqa: E402

WANTED = [
    ("category", "VARCHAR(50) DEFAULT 'Other'"),
    ("location", "VARCHAR(100) NULL"),
    ("priority", "VARCHAR(20) DEFAULT 'Medium'"),
]

conn = get_connection()
cursor = conn.cursor()

db_name = os.getenv("DB_NAME", "campusconnect")

try:
    for column, definition in WANTED:
        cursor.execute(
            "SELECT COUNT(*) FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'complaints' "
            "AND COLUMN_NAME = %s",
            (db_name, column),
        )
        if cursor.fetchone()[0]:
            print("  have  complaints.%s" % column)
            continue

        cursor.execute(
            "ALTER TABLE complaints ADD COLUMN %s %s" % (column, definition)
        )
        print("  added complaints.%s" % column)

    # The first version of this migration defaulted the category to
    # 'General', which none of the page's category filters know. Align the
    # default and any rows written with it to 'Other' (idempotent).
    cursor.execute(
        "SELECT COLUMN_DEFAULT FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'complaints' "
        "AND COLUMN_NAME = 'category'",
        (db_name,),
    )
    current_default = (cursor.fetchone() or ("",))[0]
    if current_default and "General" in str(current_default):
        cursor.execute(
            "ALTER TABLE complaints MODIFY COLUMN category VARCHAR(50) DEFAULT 'Other'"
        )
        print("  set  complaints.category default -> 'Other'")

    cursor.execute(
        "UPDATE complaints SET category = 'Other' WHERE category = 'General'"
    )
    if cursor.rowcount:
        print("  rows: General -> Other:", cursor.rowcount)

    conn.commit()
    print("migration complete")
finally:
    cursor.close()
    conn.close()
