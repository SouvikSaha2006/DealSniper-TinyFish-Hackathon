from functools import lru_cache
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    TINYFISH_API_KEY: str = ""
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"

    # TinyFish API endpoints
    TINYSEARCH_URL: str = "https://api.search.tinyfish.ai"
    TINYFETCH_URL: str = "https://api.fetch.tinyfish.ai"
    TINYAGENT_SSE_URL: str = "https://agent.tinyfish.ai/v1/automation/run-sse"

    # Timeouts in seconds
    HTTP_TIMEOUT_SECONDS: float = 60.0
    AGENT_SSE_TIMEOUT_SECONDS: float = 180.0

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
