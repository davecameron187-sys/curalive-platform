import os
from pydantic import BaseSettings, root_validator

class Settings(BaseSettings):
    app_name: str = "CuraLive AI Core"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/curalive"
    log_level: str = "INFO"
    llm_provider: str = "openai"
    llm_model: str = "gpt-4.1-mini"
    llm_api_key: str = None
    embedding_model: str = "text-embedding-3-small"

    class Config:
        env_file = '.env'
        extra = 'ignore'

    @root_validator(pre=False)
    def fix_database_url(cls, values):
        url = values.get('database_url', '')
        if url.startswith("postgresql://"):
            values['database_url'] = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return values

settings = Settings()
