

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


    app_name: str = "AI Resume Analyzer"
    app_env: Literal["development", "production", "test"] = "development"
    app_port: int = 8000
    debug: bool = False


    supabase_url: str
    supabase_key: str
    supabase_storage_bucket: str = "resumes"


    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral"


    embedding_model: str = "all-MiniLM-L6-v2"
    spacy_model: str = "en_core_web_sm"


    max_upload_size_mb: int = 10
    allowed_extensions: list[str] = [".pdf", ".docx"]


    cors_origins: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
