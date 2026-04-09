import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CuraLive AI Core"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/curalive"
    log_level: str = "INFO"
    llm_provider: str = "openai"
    llm_model: str = "gpt-4.1-mini"
    llm_api_key: str | None = None
    embedding_model: str = "text-embedding-3-small"

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    @model_validator(mode="after")
    def fix_database_url(self) -> "Settings":
        url = self.database_url
        if url.startswith("postgresql://"):
            self.database_url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self


settings = Settings()
