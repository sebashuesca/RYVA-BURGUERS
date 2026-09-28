"""Configuración por entorno; nunca almacena secretos en el repositorio."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    mysql_ssl_ca: str | None = None
    mysql_ssl_ca_pem: str | None = None
    db_ssl_required: bool = True
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173"
    admin_api_key: str
    kitchen_latitude: float = Field(ge=-90, le=90)
    kitchen_longitude: float = Field(ge=-180, le=180)
    kitchen_stations: int = Field(default=2, ge=1, le=100)
    delivery_base_fee: float = Field(default=20.0, ge=0)
    delivery_fee_per_km: float = Field(default=5.0, ge=0)
    delivery_speed_kmh: float = Field(default=20.0, gt=0)

    @field_validator("admin_api_key")
    @classmethod
    def validate_admin_key(cls, value: str) -> str:
        if len(value) < 16:
            raise ValueError("ADMIN_API_KEY debe tener al menos 16 caracteres")
        return value

    @model_validator(mode="after")
    def validate_production(self):
        if self.app_env == "production":
            if self.admin_api_key.startswith("CAMBIAR_"):
                raise ValueError("Configura un ADMIN_API_KEY secreto en producción")
            if "*" in self.allowed_origins:
                raise ValueError("CORS_ORIGINS debe indicar dominios concretos en producción")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
