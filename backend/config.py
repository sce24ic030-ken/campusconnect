# =========================================================
# CAMPUSCONNECT BACKEND CONFIGURATION
# Values are read from the .env file (see .env.example)
# =========================================================

import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)


class Config:
    """Central configuration for the CampusConnect backend."""

    # -----------------------------------------------------
    # FLASK
    # -----------------------------------------------------
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "campusconnect-development-secret-key-please-change-me"
    )

    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("1", "true", "yes")

    # -----------------------------------------------------
    # JWT AUTHENTICATION
    # -----------------------------------------------------
    JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

    # -----------------------------------------------------
    # MYSQL DATABASE
    # -----------------------------------------------------
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "campusconnect")

    # -----------------------------------------------------
    # CORS
    # Comma-separated list of allowed origins, or "*" for any.
    # -----------------------------------------------------
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    # -----------------------------------------------------
    # CHATBOT (NVIDIA NIM, OpenAI-compatible)
    # The key is a SECRET: set it in .env, never in source.
    # -----------------------------------------------------
    NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
    CHATBOT_BASE_URL = os.getenv(
        "CHATBOT_BASE_URL", "https://integrate.api.nvidia.com/v1"
    )
    CHATBOT_MODEL = os.getenv("CHATBOT_MODEL", "openai/gpt-oss-20b")
    CHATBOT_MAX_TOKENS = int(os.getenv("CHATBOT_MAX_TOKENS", "1024"))
    CHATBOT_TEMPERATURE = float(os.getenv("CHATBOT_TEMPERATURE", "0.6"))
    CHATBOT_TIMEOUT = int(os.getenv("CHATBOT_TIMEOUT", "30"))
    # gpt-oss is a reasoning model; "low" keeps replies responsive.
    CHATBOT_REASONING_EFFORT = os.getenv("CHATBOT_REASONING_EFFORT", "low")


class DevelopmentConfig(Config):
    # Respect FLASK_DEBUG so the auto-reloader can be switched off.
    DEBUG = Config.DEBUG


class ProductionConfig(Config):
    DEBUG = False


def get_config():
    """Return the config class based on the FLASK_ENV variable."""

    env = os.getenv("FLASK_ENV", "development").lower()

    if env == "production":
        # Refuse to start in production with the insecure defaults.
        missing = [
            key
            for key in ("SECRET_KEY", "JWT_SECRET")
            if not os.getenv(key)
        ]

        if missing:
            raise RuntimeError(
                "Missing required production environment variable(s): "
                + ", ".join(missing)
            )

        return ProductionConfig

    return DevelopmentConfig
