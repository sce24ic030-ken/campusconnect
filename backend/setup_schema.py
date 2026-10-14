import os
import mysql.connector
from dotenv import load_dotenv


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)


# =========================================================
# CONNECT TO MYSQL
# =========================================================

connection = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)

cursor = connection.cursor()


# =========================================================
# READ SCHEMA FILE
# =========================================================

schema_path = os.path.join(
    BASE_DIR,
    "database",
    "schema.sql"
)

with open(schema_path, "r", encoding="utf-8") as file:
    schema = file.read()


# =========================================================
# EXECUTE SQL STATEMENTS
# =========================================================

statements = schema.split(";")

for statement in statements:

    statement = statement.strip()

    if not statement:
        continue

    # Skip SHOW TABLES because we check the tables separately below
    if statement.upper().startswith("SHOW TABLES"):
        continue

    try:
        cursor.execute(statement)

        # Consume any result returned by the statement
        if cursor.with_rows:
            cursor.fetchall()

    except mysql.connector.Error as error:
        print("\nSQL ERROR:")
        print(error)
        print("\nStatement:")
        print(statement[:300])
        connection.rollback()
        cursor.close()
        connection.close()
        raise


# =========================================================
# SAVE CHANGES
# =========================================================

connection.commit()


# =========================================================
# SELECT DATABASE
# =========================================================

cursor.execute("USE campusconnect")

if cursor.with_rows:
    cursor.fetchall()


# =========================================================
# CHECK TABLES
# =========================================================

cursor.execute("SHOW TABLES")

tables = cursor.fetchall()


# =========================================================
# DISPLAY RESULT
# =========================================================

print("\n========================================")
print("CampusConnect database setup successful!")
print("========================================")

print("\nTables created:")

for table in tables:
    print(" -", table[0])


# =========================================================
# CLOSE CONNECTION
# =========================================================

cursor.close()
connection.close()

print("\nMySQL connection closed.")