import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    app_name: str = "CuraLive AI Core"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/curalive"
    log_level: str = "INFO"
    llm_provider: str = "openai"
    llm_model: str = "gpt-4-turbo"
    llm_api_key: str = None
    embedding_model: str = "text-embedding-3-small"
    
    class Config:
        env_file = '.env'

settings = Settings()
