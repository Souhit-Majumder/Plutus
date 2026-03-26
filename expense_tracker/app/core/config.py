# ─────────────────────────────────────────────────────────────────────────────
# core/config.py
#
# This file loads all configuration from environment variables (the .env file).
# Using pydantic-settings makes it easy to validate and type-check settings.
# ─────────────────────────────────────────────────────────────────────────────

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from the .env file.
    Every attribute here corresponds to a variable in .env.
    """

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/expense_tracker"

    # ── JWT (JSON Web Token) ──────────────────────────────────────────────────
    # SECRET_KEY  : used to sign tokens — keep this private!
    # ALGORITHM   : HS256 means HMAC with SHA-256 (a symmetric algorithm)
    # EXPIRE      : how many minutes before a token is considered expired
    SECRET_KEY: str = "changeme"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── App meta ──────────────────────────────────────────────────────────────
    APP_NAME: str = "Expense Tracker API"
    DEBUG: bool = True

    class Config:
        # pydantic-settings will read from this file automatically
        env_file = ".env"
        env_file_encoding = "utf-8"


# Create a single global settings instance.
# Import this object anywhere in the project: from app.core.config import settings
settings = Settings()
