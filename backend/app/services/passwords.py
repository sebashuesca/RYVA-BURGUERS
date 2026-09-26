"""Hash PBKDF2-SHA256 compatible con las cuentas de muestra del Módulo 1."""

from base64 import b64encode
from hashlib import pbkdf2_hmac
from os import urandom


def hash_password(password: str) -> str:
    salt = urandom(16)
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600_000)
    return f"pbkdf2_sha256$600000${b64encode(salt).decode()}${b64encode(digest).decode()}"
