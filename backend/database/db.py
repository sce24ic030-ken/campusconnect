import sqlite3
import os


# Path to the backend folder
BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


# SQLite database location
DATABASE_PATH = os.path.join(
    BASE_DIR,
    "database",
    "college.db"
)


def get_db_connection():

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    # Access columns using column names
    connection.row_factory = sqlite3.Row

    # Enable foreign keys
    connection.execute(
        "PRAGMA foreign_keys = ON"
    )

    return connection