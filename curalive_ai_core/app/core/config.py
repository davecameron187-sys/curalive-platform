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
    For Render deployment, use explicit PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD.
    """
    
    model_config = SettingsConfigDict(
        env_file='.env',
        case_sensitive=False,
        extra='ignore',
    )
    
    app_name: str = "CuraLive AI Core"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    
    # Explicit Postgres environment variables for Render
    # These MUST be set in Render's environment for the service to connect to the database
    pg_host: str = Field(validation_alias="PGHOST", default="localhost")
    pg_port: int = Field(validation_alias="PGPORT", default=5432)
    pg_database: str = Field(validation_alias="PGDATABASE", default="curalive")
    pg_user: str = Field(validation_alias="PGUSER", default="postgres")
    pg_password: str = Field(validation_alias="PGPASSWORD", default="postgres")
    
    log_level: str = "INFO"
    llm_provider: str = "openai"
    llm_model: str = "gpt-4-turbo"
    llm_api_key: Optional[str] = Field(default=None, validation_alias='OPENAI_API_KEY')
    embedding_model: str = "text-embedding-3-small"

    @property
    def database_url(self) -> str:
        """Build SQLAlchemy database URL from explicit Postgres env vars."""
        url = URL.create(
            drivername="postgresql+psycopg2",
            username=self.pg_user,
            password=self.pg_password,
            host=self.pg_host,
            port=self.pg_port,
            database=self.pg_database,
        )
        return str(url)


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
logger.info(f"[CuraLive AI Core] Connecting to {settings.pg_host}:{settings.pg_port}/{settings.pg_database} as {settings.pg_user}")

# Debug: Log which environment variables are being read
logger.debug(f"[CuraLive AI Core] PGHOST from env: {os.getenv('PGHOST', 'NOT SET')}")
logger.debug(f"[CuraLive AI Core] PGPORT from env: {os.getenv('PGPORT', 'NOT SET')}")
logger.debug(f"[CuraLive AI Core] PGDATABASE from env: {os.getenv('PGDATABASE', 'NOT SET')}")
logger.debug(f"[CuraLive AI Core] PGUSER from env: {os.getenv('PGUSER', 'NOT SET')}")
logger.debug(f"[CuraLive AI Core] PGPASSWORD from env: {'SET' if os.getenv('PGPASSWORD') else 'NOT SET'}")
