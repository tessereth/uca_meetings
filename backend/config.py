from collections.abc import Callable
from typing import Any

from pydantic import (
    PostgresDsn,
)

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    POSTGRES_DSN: PostgresDsn = 'postgresql://localhost:5432/uca_meetings'

    model_config = SettingsConfigDict(
        env_prefix='UCA_MEETINGS_',
        env_file="../.env",
        env_ignore_empty=True,
        extra="ignore",
    )

settings = Settings()
