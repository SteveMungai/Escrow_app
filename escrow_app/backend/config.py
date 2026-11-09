import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy.pool import NullPool

load_dotenv()


def _normalize_db_url(url):

    if not url:
        return url
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def _local_db_url():
    user = quote_plus(os.getenv("DB_USER", "postgres"))
    password = quote_plus(os.getenv("DB_PASSWORD", "postgres"))
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "escrow_app")
    return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{name}"



DATABASE_URL = _normalize_db_url(os.getenv("DATABASE_URL")) or _local_db_url()
_IS_LOCAL_DB = "@localhost" in DATABASE_URL or "@127.0.0.1" in DATABASE_URL


class Config:
    """Base config — shared by all environments."""

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "connect_args": {

            "prepare_threshold": None,
            # Supabase setting for SSL; 
            "sslmode": "prefer" if _IS_LOCAL_DB else "require",
        },
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
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(os.getenv("TEST_DATABASE_URL")) or (
        _local_db_url().rsplit("/", 1)[0] + "/" + os.getenv("TEST_DB_NAME", "escrow_app_test")
    )


class ProductionConfig(Config):
    DEBUG = False
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(os.getenv("DATABASE_URL"))
   
    SQLALCHEMY_ENGINE_OPTIONS = {
        **Config.SQLALCHEMY_ENGINE_OPTIONS,
        "poolclass": NullPool,
    }

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
    # Vercel sets VERCEL=1 on every deployment, so production is picked
    # automatically there; locally it defaults to development.
    env = os.getenv("FLASK_ENV") or ("production" if os.getenv("VERCEL") else "development")
    config_class = config_by_name.get(env, DevelopmentConfig)

    if config_class is ProductionConfig:
        config_class.validate()

    return config_class