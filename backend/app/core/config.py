
from functools import lru_cache
from typing import Literal, List

from pydantic import model_validator, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


WEAK_DEFAULT_KEY = "default_unsafe_dev_key"


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
    # SecretStr prevents the key appearing in logs/repr
    api_key: SecretStr = SecretStr(WEAK_DEFAULT_KEY)

    supabase_url: str
    supabase_key: SecretStr
    supabase_storage_bucket: str = "resumes"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral"

    embedding_model: str = "all-MiniLM-L6-v2"
    spacy_model: str = "en_core_web_sm"

    max_upload_size_mb: int = 10
    allowed_extensions: list[str] = [".pdf", ".docx"]

    cors_origins: List[str] = ["http://localhost:3000"]

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.app_env == "production":
            key_val = self.api_key.get_secret_value()
            if key_val == WEAK_DEFAULT_KEY or len(key_val) < 32:
                raise ValueError(
                    "API_KEY must be set to a strong secret (>=32 chars) in production. "
                    "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
                )
            if "*" in self.cors_origins:
                raise ValueError("Wildcard CORS origin is not allowed in production.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
