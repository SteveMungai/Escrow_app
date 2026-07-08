import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base config — shared by all environments."""

    # --- PostgreSQL / pgAdmin 4 connection (set these in a .env file) ---
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "escrow_app")

    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,  # avoids "server closed the connection" errors after idle time
    }
    SQLALCHEMY_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"  # SQL_ECHO=true logs every query

    # --- Flask / security ---
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")
    JSON_SORT_KEYS = False  # preserve key order as written in each model's to_dict()

    # --- CORS ---
    # Comma-separated list in .env, e.g. CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    DEBUG = False
    TESTING = False


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DB_NAME = os.getenv("TEST_DB_NAME", "escrow_app_test")
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:"
        f"{Config.DB_PORT}/{DB_NAME}"
    )


class ProductionConfig(Config):
    DEBUG = False
    # In production, fail loudly if these aren't set rather than silently using
    # the insecure development defaults above.
    SECRET_KEY = os.environ["FLASK_SECRET_KEY"]
    SQLALCHEMY_DATABASE_URI = os.environ["DATABASE_URL"]


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config():
    """Reads FLASK_ENV from .env (defaults to development) and returns the matching config class."""
    env = os.getenv("FLASK_ENV", "development")
    return config_by_name.get(env, DevelopmentConfig)