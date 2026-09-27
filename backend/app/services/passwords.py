"""Hash PBKDF2-SHA256 compatible con las cuentas de muestra del Módulo 1."""

from base64 import b64decode, b64encode
from hashlib import pbkdf2_hmac
from os import urandom
from secrets import compare_digest


def hash_password(password: str) -> str:
    salt = urandom(16)
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600_000)
    return f"pbkdf2_sha256$600000${b64encode(salt).decode()}${b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, rounds, salt, expected = stored.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(rounds)
        if iterations < 100_000 or iterations > 2_000_000:
            return False
        actual = pbkdf2_hmac("sha256", password.encode("utf-8"), b64decode(salt), iterations)
        return compare_digest(actual, b64decode(expected))
    except (ValueError, TypeError):
        return False
