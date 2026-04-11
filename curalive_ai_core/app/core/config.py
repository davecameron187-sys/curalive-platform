import logging
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    app_name: str = "CuraLive AI Core"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(
        validation_alias="DATABASE_URL",
        default="postgresql://postgres:postgres@localhost:5432/curalive"
    )
    log_level: str = "INFO"
    llm_provider: str = "openai"
    llm_model: str = "gpt-4-turbo"
    llm_api_key: Optional[str] = Field(default=None, validation_alias='OPENAI_API_KEY')
    embedding_model: str = "text-embedding-3-small"
    
    class Config:
        env_file = '.env'
        case_sensitive = False


settings = Settings()

# Log sanitized database URL for debugging (mask password)
def _sanitize_url(url: str) -> str:
    """Mask password in URL for logging."""
    if '@' in url:
        scheme_and_creds, host_part = url.rsplit('@', 1)
        if ':' in scheme_and_creds:
            scheme, _ = scheme_and_creds.split('://', 1)
            user = scheme_and_creds.split('://', 1)[1].split(':')[0]
            return f"{scheme}://{user}:***@{host_part}"
    return url


logger.info(f"[CuraLive AI Core] Database URL: {_sanitize_url(settings.database_url)}")
