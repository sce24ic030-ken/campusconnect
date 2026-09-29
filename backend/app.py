from flask import Flask, jsonify
from flask_cors import CORS

from routes.auth import auth_bp


# =========================================================
# CREATE FLASK APPLICATION
# =========================================================

app = Flask(__name__)

# Allow your frontend HTML/JavaScript to communicate
# with the Flask backend.
CORS(app)


# =========================================================
# REGISTER ROUTES
# =========================================================

app.register_blueprint(auth_bp)


# =========================================================
# HOME / HEALTH CHECK
# =========================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "CampusConnect Backend is running!"
    })


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )