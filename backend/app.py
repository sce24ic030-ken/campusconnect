from flask import Flask, jsonify
from flask_cors import CORS

from config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    @app.get("/")
    def home():
        return jsonify({
            "message": "AI College Companion backend is running"
        })

    @app.get("/api/health")
    def health_check():
        return jsonify({
            "status": "ok",
            "service": "AI College Companion API"
        })

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)