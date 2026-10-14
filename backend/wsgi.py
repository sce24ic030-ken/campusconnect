# =========================================================
# WSGI ENTRY POINT
# Used by production servers (e.g. PythonAnywhere, gunicorn).
#   gunicorn app:app        <- uses the "app" object in app.py
#   PythonAnywhere WSGI     <- imports "application" from here
# =========================================================

from app import app as application


if __name__ == "__main__":
    application.run()
