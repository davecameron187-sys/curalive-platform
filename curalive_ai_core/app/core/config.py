import logging
import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Settings for CuraLive AI Core.
    
    Environment variables are read from the OS environment.
    For Render deployment, use DATABASE_URL and LLM_API_KEY.
    """
    
    model_config = SettingsConfigDict(
        env_file='.env',
        case_sensitive=False,
        extra='ignore',
    )
    
    app_name: str = "CuraLive AI Core"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    
    # Database URL for Render deployment
    # For local development, defaults to localhost connection
    database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/curalive",
        validation_alias="DATABASE_URL"
    )
    
    log_level: str = "INFO"
    llm_provider: str = "openai"
    llm_model: str = "gpt-4-turbo"
    llm_api_key: Optional[str] = Field(default=None, validation_alias='LLM_API_KEY')
    embedding_model: str = "text-embedding-3-small"


# Initialize settings by reading from environment
settings = Settings()


def _sanitize_url(url: str) -> str:
    """Mask password in URL for logging."""
    if '@' in url:
        scheme_and_creds, host_part = url.rsplit('@', 1)
        if ':' in scheme_and_creds:
            scheme, _ = scheme_and_creds.split('://', 1)
            user = scheme_and_creds.split('://', 1)[1].split(':')[0]
            return f"{scheme}://{user}:***@{host_part}"
    return url


# Log startup information
logger.info(f"[CuraLive AI Core] Database URL: {_sanitize_url(settings.database_url)}")
logger.info(f"[CuraLive AI Core] LLM Provider: {settings.llm_provider}")

# Debug: Log which environment variables are being read
logger.debug(f"[CuraLive AI Core] DATABASE_URL from env: {'SET' if os.getenv('DATABASE_URL') else 'NOT SET'}")
logger.debug(f"[CuraLive AI Core] LLM_API_KEY from env: {'SET' if os.getenv('LLM_API_KEY') else 'NOT SET'}")
