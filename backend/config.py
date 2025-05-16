from collections.abc import Callable
from typing import Any

from pydantic import (
    PostgresDsn,
)

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    POSTGRES_DSN: PostgresDsn

    model_config = SettingsConfigDict(
        env_prefix='UCA_MEETINGS_',
        env_file="../.env",
        env_ignore_empty=True,
        extra="ignore",
    )

settings = Settings()
