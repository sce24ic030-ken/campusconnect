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
    # Managed MySQL hosts (Aiven, etc.) use a non-default port and
    # require TLS, so all of that is configurable from the env.
    # -----------------------------------------------------
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "campusconnect")

    # Path to the provider's CA certificate (e.g. Aiven's ca.pem).
    # When set, the connection requires TLS and verifies the server.
    DB_SSL_CA = os.getenv("DB_SSL_CA", "").strip()

    # Force TLS on/off. Empty means "decide automatically":
    # on for any host other than localhost/127.0.0.1, off otherwise.
    DB_SSL = os.getenv("DB_SSL", "").strip().lower()

    # The app normally creates its own database on first run.
    # Managed providers give you an existing database, so skip it.
    DB_SKIP_CREATE = os.getenv("DB_SKIP_CREATE", "").strip().lower() in (
        "1", "true", "yes",
    )

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

    # -----------------------------------------------------
    # VOICE INPUT (speech-to-text)
    # Runs server-side via NVIDIA's hosted speech NIM (gRPC) so the
    # microphone works in every browser. Reuses NVIDIA_API_KEY above.
    # -----------------------------------------------------
    ASR_ENABLED = os.getenv("ASR_ENABLED", "true").lower() in ("1", "true", "yes")

    # NVCF hosted endpoint + the function (model) to call.
    # whisper-large-v3 is the model NVIDIA hosts here; the function-id
    # selects it. See https://build.nvidia.com/openai/whisper-large-v3
    ASR_SERVER = os.getenv("ASR_SERVER", "grpc.nvcf.nvidia.com:443")
    ASR_FUNCTION_ID = os.getenv(
        "ASR_FUNCTION_ID", "b702f636-f60c-4a3d-a6f4-f3568c13bd7d"
    )
    # Optional model override; normally left empty so the function-id
    # (ASR_FUNCTION_ID) chooses the model.
    ASR_MODEL = os.getenv("ASR_MODEL", "")
    ASR_LANGUAGE = os.getenv("ASR_LANGUAGE", "en")
    ASR_TIMEOUT = int(os.getenv("ASR_TIMEOUT", "45"))

    # Largest upload we accept for one clip (bytes). ~8 MB ≈ a few minutes.
    ASR_MAX_BYTES = int(os.getenv("ASR_MAX_BYTES", str(8 * 1024 * 1024)))


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
