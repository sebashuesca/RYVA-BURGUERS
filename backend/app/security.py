"""Llave sencilla para operaciones internas; no se incluye en el frontend."""

from secrets import compare_digest

from fastapi import Header, HTTPException

from app.config import get_settings


def require_admin_key(x_admin_key: str | None = Header(default=None)) -> None:
    expected = get_settings().admin_api_key
    if x_admin_key is None or not compare_digest(x_admin_key, expected):
        raise HTTPException(status_code=401, detail="Clave administrativa inválida")
