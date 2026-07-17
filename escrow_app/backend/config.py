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
        "pool_pre_ping": True,
    }
    SQLALCHEMY_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")
    JSON_SORT_KEYS = False

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
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

    @classmethod
    def validate(cls):
        missing = [
            name for name, val in [
                ("FLASK_SECRET_KEY", cls.SECRET_KEY),
                ("DATABASE_URL", cls.SQLALCHEMY_DATABASE_URI),
            ] if not val
        ]
        if missing:
            raise RuntimeError(
                f"Production is missing required environment variables: {', '.join(missing)}"
            )


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config():
    """Reads FLASK_ENV from .env (defaults to development) and returns the matching config class."""
    env = os.getenv("FLASK_ENV", "development")
    config_class = config_by_name.get(env, DevelopmentConfig)

    if config_class is ProductionConfig:
        config_class.validate()

    return config_class