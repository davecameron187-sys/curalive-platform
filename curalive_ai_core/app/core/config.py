import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "CuraLive AI Core"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/curalive")
    log_level: str = "INFO"
    llm_provider: str = "openai"
    llm_model: str = "gpt-4-turbo"
    llm_api_key: Optional[str] = Field(default=None, validation_alias='OPENAI_API_KEY')
    embedding_model: str = "text-embedding-3-small"
    
    class Config:
        env_file = '.env'

settings = Settings()
