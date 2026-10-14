# =========================================================
# CAMPUSCONNECT ACADEMICS SEED
#
# Fills the `courses` and `faculty` tables with a real
# curriculum for the three programs in scope:
#
#   BCA  - Computer Applications
#   BBA  - Management Studies
#   BCOM - Commerce
#
# Every program runs six semesters with five subjects each.
#
# The script is idempotent: re-running it updates existing rows
# instead of duplicating them, so it is safe to run on a local
# database and on a managed host (Aiven) alike.
#
#   python seed_academics.py
# =========================================================

import os

from dotenv import load_dotenv

from database.db import get_connection

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


# =========================================================
# FACULTY
# (name, department, designation, email, subject)
# =========================================================

FACULTY = [
    # ---- Computer Applications ----
    ("Dr. Anita Sharma", "Computer Applications", "Associate Professor", "anita.sharma@campusconnect.edu", "Database Systems"),
    ("Priya Iyer", "Computer Applications", "Assistant Professor", "priya.iyer@campusconnect.edu", "Web Technologies"),
    ("Rakesh Kumar", "Computer Applications", "Assistant Professor", "rakesh.kumar@campusconnect.edu", "Programming"),
    ("Dr. Sunil Rao", "Computer Applications", "Professor", "sunil.rao@campusconnect.edu", "Computer Networks"),
    ("Kavita Mehta", "Computer Applications", "Assistant Professor", "kavita.mehta@campusconnect.edu", "Mathematics"),
    ("Dr. Vikram Singh", "Computer Applications", "Professor", "vikram.singh@campusconnect.edu", "Artificial Intelligence"),

    # ---- Management Studies ----
    ("Dr. Neha Kapoor", "Management Studies", "Professor", "neha.kapoor@campusconnect.edu", "Management"),
    ("Suresh Menon", "Management Studies", "Associate Professor", "suresh.menon@campusconnect.edu", "Accounting and Finance"),
    ("Dr. Arjun Desai", "Management Studies", "Associate Professor", "arjun.desai@campusconnect.edu", "Economics"),
    ("Meera Nair", "Management Studies", "Assistant Professor", "meera.nair@campusconnect.edu", "Marketing"),
    ("Dr. Ramesh Gupta", "Management Studies", "Professor", "ramesh.gupta@campusconnect.edu", "Business Law"),

    # ---- Commerce ----
    ("Dr. Sanjay Verma", "Commerce", "Professor", "sanjay.verma@campusconnect.edu", "Accounting"),
    ("Anjali Bose", "Commerce", "Assistant Professor", "anjali.bose@campusconnect.edu", "Taxation and Audit"),
    ("Dr. Kavya Reddy", "Commerce", "Associate Professor", "kavya.reddy@campusconnect.edu", "Finance"),
    ("Manoj Patel", "Commerce", "Assistant Professor", "manoj.patel@campusconnect.edu", "Corporate Law"),
    ("Dr. Shalini Joshi", "Commerce", "Associate Professor", "shalini.joshi@campusconnect.edu", "Commerce"),
]


# =========================================================
# CURRICULUM
# (program, semester) -> [ (code, subject, credits, faculty_name) ]
# =========================================================

CURRICULUM = {
    "BCA": {
        1: [
            ("BCA101", "Programming in C", 4, "Rakesh Kumar"),
            ("BCA102", "Digital Fundamentals", 4, "Dr. Sunil Rao"),
            ("BCA103", "Mathematics I", 4, "Kavita Mehta"),
            ("BCA104", "English", 3, "Kavita Mehta"),
            ("BCA105", "Computer Fundamentals Lab", 2, "Rakesh Kumar"),
        ],
        2: [
            ("BCA201", "Data Structures", 4, "Rakesh Kumar"),
            ("BCA202", "Object Oriented Programming", 4, "Rakesh Kumar"),
            ("BCA203", "Mathematics II", 4, "Kavita Mehta"),
            ("BCA204", "Database Fundamentals", 3, "Dr. Anita Sharma"),
            ("BCA205", "Programming Lab", 2, "Priya Iyer"),
        ],
        3: [
            ("BCA301", "Database Management System", 4, "Dr. Anita Sharma"),
            ("BCA302", "Web Programming", 4, "Priya Iyer"),
            ("BCA303", "Computer Networks", 4, "Dr. Sunil Rao"),
            ("BCA304", "Operating Systems", 4, "Dr. Sunil Rao"),
            ("BCA305", "Web Programming Lab", 2, "Priya Iyer"),
        ],
        4: [
            ("BCA401", "Software Engineering", 4, "Rakesh Kumar"),
            ("BCA402", "Artificial Intelligence", 4, "Dr. Vikram Singh"),
            ("BCA403", "Computer Graphics", 4, "Dr. Vikram Singh"),
            ("BCA404", "Python Programming", 4, "Rakesh Kumar"),
            ("BCA405", "Python Lab", 2, "Rakesh Kumar"),
        ],
        5: [
            ("BCA501", "Cloud Computing", 4, "Dr. Sunil Rao"),
            ("BCA502", "Machine Learning", 4, "Dr. Vikram Singh"),
            ("BCA503", "Cyber Security", 4, "Dr. Sunil Rao"),
            ("BCA504", "Mobile Application Development", 4, "Priya Iyer"),
            ("BCA505", "Project Work", 3, "Dr. Anita Sharma"),
        ],
        6: [
            ("BCA601", "Advanced Java Programming", 4, "Rakesh Kumar"),
            ("BCA602", "Data Warehousing and Mining", 4, "Dr. Anita Sharma"),
            ("BCA603", "Internet of Things", 4, "Dr. Sunil Rao"),
            ("BCA604", "Software Testing and Quality Assurance", 4, "Rakesh Kumar"),
            ("BCA605", "Major Project", 6, "Dr. Vikram Singh"),
        ],
    },

    "BBA": {
        1: [
            ("BBA101", "Principles of Management", 4, "Dr. Neha Kapoor"),
            ("BBA102", "Business Economics", 4, "Dr. Arjun Desai"),
            ("BBA103", "Financial Accounting", 4, "Suresh Menon"),
            ("BBA104", "Business Mathematics", 3, "Kavita Mehta"),
            ("BBA105", "Communication Skills", 3, "Dr. Neha Kapoor"),
        ],
        2: [
            ("BBA201", "Organisational Behaviour", 4, "Dr. Neha Kapoor"),
            ("BBA202", "Business Statistics", 4, "Kavita Mehta"),
            ("BBA203", "Business Law", 4, "Dr. Ramesh Gupta"),
            ("BBA204", "Marketing Management", 4, "Meera Nair"),
            ("BBA205", "Business Environment", 3, "Dr. Arjun Desai"),
        ],
        3: [
            ("BBA301", "Human Resource Management", 4, "Dr. Neha Kapoor"),
            ("BBA302", "Cost Accounting", 4, "Suresh Menon"),
            ("BBA303", "Financial Management", 4, "Suresh Menon"),
            ("BBA304", "Production and Operations Management", 4, "Dr. Neha Kapoor"),
            ("BBA305", "Research Methodology", 3, "Kavita Mehta"),
        ],
        4: [
            ("BBA401", "Entrepreneurship Development", 4, "Dr. Neha Kapoor"),
            ("BBA402", "Management Accounting", 4, "Suresh Menon"),
            ("BBA403", "International Business", 4, "Dr. Arjun Desai"),
            ("BBA404", "Business Analytics", 4, "Kavita Mehta"),
            ("BBA405", "Business Analytics Lab", 2, "Kavita Mehta"),
        ],
        5: [
            ("BBA501", "Strategic Management", 4, "Dr. Neha Kapoor"),
            ("BBA502", "Income Tax Law and Practice", 4, "Dr. Ramesh Gupta"),
            ("BBA503", "Project Management", 4, "Dr. Neha Kapoor"),
            ("BBA504", "Retail Management", 3, "Meera Nair"),
            ("BBA505", "Summer Internship Report", 3, "Dr. Neha Kapoor"),
        ],
        6: [
            ("BBA601", "Corporate Governance and Ethics", 4, "Dr. Neha Kapoor"),
            ("BBA602", "International Marketing", 4, "Meera Nair"),
            ("BBA603", "Services Marketing", 4, "Meera Nair"),
            ("BBA604", "Operations Research", 4, "Kavita Mehta"),
            ("BBA605", "Capstone Project", 6, "Dr. Neha Kapoor"),
        ],
    },

    "BCOM": {
        1: [
            ("COM101", "Financial Accounting I", 4, "Dr. Sanjay Verma"),
            ("COM102", "Business Organisation", 4, "Dr. Shalini Joshi"),
            ("COM103", "Business Economics", 4, "Dr. Shalini Joshi"),
            ("COM104", "Business Mathematics", 3, "Kavita Mehta"),
            ("COM105", "English for Commerce", 3, "Dr. Shalini Joshi"),
        ],
        2: [
            ("COM201", "Financial Accounting II", 4, "Dr. Sanjay Verma"),
            ("COM202", "Corporate Accounting", 4, "Dr. Sanjay Verma"),
            ("COM203", "Business Statistics", 4, "Kavita Mehta"),
            ("COM204", "Business Law", 4, "Manoj Patel"),
            ("COM205", "Income Tax", 3, "Anjali Bose"),
        ],
        3: [
            ("COM301", "Cost Accounting", 4, "Dr. Kavya Reddy"),
            ("COM302", "Company Law", 4, "Manoj Patel"),
            ("COM303", "Auditing", 4, "Anjali Bose"),
            ("COM304", "Business Management", 4, "Dr. Shalini Joshi"),
            ("COM305", "Marketing Management", 3, "Meera Nair"),
        ],
        4: [
            ("COM401", "Advanced Accounting", 4, "Dr. Sanjay Verma"),
            ("COM402", "Management Accounting", 4, "Dr. Kavya Reddy"),
            ("COM403", "Income Tax Law and Practice", 4, "Anjali Bose"),
            ("COM404", "Business Environment", 4, "Dr. Shalini Joshi"),
            ("COM405", "Entrepreneurship Development", 3, "Dr. Shalini Joshi"),
        ],
        5: [
            ("COM501", "Corporate Accounting II", 4, "Dr. Sanjay Verma"),
            ("COM502", "Goods and Services Tax", 4, "Anjali Bose"),
            ("COM503", "Financial Management", 4, "Dr. Kavya Reddy"),
            ("COM504", "Commerce Laboratory", 2, "Dr. Kavya Reddy"),
            ("COM505", "Research Methodology", 3, "Kavita Mehta"),
        ],
        6: [
            ("COM601", "Strategic Cost Management", 4, "Dr. Kavya Reddy"),
            ("COM602", "Financial Reporting", 4, "Dr. Sanjay Verma"),
            ("COM603", "International Business", 4, "Dr. Shalini Joshi"),
            ("COM604", "Financial Markets and Institutions", 4, "Dr. Kavya Reddy"),
            ("COM605", "Commerce Project", 6, "Dr. Sanjay Verma"),
        ],
    },
}

DEPARTMENT = {
    "BCA": "Computer Applications",
    "BBA": "Management Studies",
    "BCOM": "Commerce",
}

# Rows left behind by the very first hand-written seed. They sat in
# BCA semester 5 under a placeholder lecturer and would duplicate the
# real BCA semester 5 subjects.
OBSOLETE_CODES = ("CS301", "CS302", "CS303", "CS304")


def seed_faculty(cursor):
    inserted = 0

    for name, department, designation, email, subject in FACULTY:
        cursor.execute(
            "SELECT id FROM faculty WHERE name = %s AND department = %s LIMIT 1",
            (name, department),
        )
        row = cursor.fetchone()

        if row:
            cursor.execute(
                "UPDATE faculty SET designation = %s, email = %s, subject = %s "
                "WHERE id = %s",
                (designation, email, subject, row[0]),
            )
        else:
            cursor.execute(
                "INSERT INTO faculty (name, department, designation, email, subject) "
                "VALUES (%s, %s, %s, %s, %s)",
                (name, department, designation, email, subject),
            )
            inserted += 1

    return inserted


def seed_courses(cursor):
    inserted = 0
    updated = 0

    for program, semesters in CURRICULUM.items():
        department = DEPARTMENT[program]

        for semester, subjects in semesters.items():
            for code, name, credits, faculty_name in subjects:
                cursor.execute(
                    "SELECT id FROM courses WHERE course_code = %s LIMIT 1",
                    (code,),
                )
                row = cursor.fetchone()

                if row:
                    cursor.execute(
                        "UPDATE courses SET course_name = %s, program = %s, "
                        "semester = %s, credits = %s, department = %s, "
                        "faculty_name = %s WHERE id = %s",
                        (name, program, semester, credits, department,
                         faculty_name, row[0]),
                    )
                    updated += 1
                else:
                    cursor.execute(
                        "INSERT INTO courses (course_code, course_name, program, "
                        "semester, credits, department, faculty_name) "
                        "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                        (code, name, program, semester, credits, department,
                         faculty_name),
                    )
                    inserted += 1

    return inserted, updated


def main():
    connection = get_connection()
    cursor = connection.cursor()

    try:
        placeholders = ", ".join(["%s"] * len(OBSOLETE_CODES))
        cursor.execute(
            "DELETE FROM courses WHERE course_code IN ({})".format(placeholders),
            OBSOLETE_CODES,
        )
        removed = cursor.rowcount

        faculty_added = seed_faculty(cursor)
        courses_added, courses_updated = seed_courses(cursor)

        connection.commit()

        print("Seed complete.")
        print("  obsolete placeholder courses removed : {}".format(removed))
        print("  faculty rows inserted                : {}".format(faculty_added))
        print("  courses inserted                     : {}".format(courses_added))
        print("  courses updated                      : {}".format(courses_updated))

        cursor.execute(
            "SELECT program, COUNT(*) FROM courses GROUP BY program ORDER BY program"
        )
        print("\nCourses per program:")
        for program, count in cursor.fetchall():
            print("  {:<6} {}".format(program, count))

        cursor.execute(
            "SELECT semester, COUNT(*) FROM courses WHERE program = 'BCA' "
            "GROUP BY semester ORDER BY semester"
        )
        print("\nBCA subjects per semester:")
        for semester, count in cursor.fetchall():
            print("  Sem {}: {}".format(semester, count))

    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    main()
