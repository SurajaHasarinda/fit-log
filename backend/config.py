from pydantic_settings import BaseSettings
from functools import lru_cache
from pydantic import field_validator
import json


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/fitlog_db"

    # Google Gemini AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-pro-preview"

    # JWT Auth
    JWT_SECRET_KEY: str = "fitlog-super-secret-key-change-in-production-2024"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    # App
    APP_NAME: str = "FitLog"
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
