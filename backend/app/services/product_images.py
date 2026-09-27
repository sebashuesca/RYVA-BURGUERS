"""Imágenes de respaldo para el catálogo, basadas en el nombre de la categoría."""

from unicodedata import combining, normalize
from urllib.parse import urlsplit

from app.services.errors import BusinessError

BURGERS = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
DRINKS = "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80"
SIDES = "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80"
DESSERTS = "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80"
GENERAL = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"


def default_image_for(category_name: str) -> str:
    plain = "".join(char for char in normalize("NFKD", category_name.casefold()) if not combining(char))
    if "hamburgues" in plain or "burger" in plain:
        return BURGERS
    if "bebida" in plain:
        return DRINKS
    if "postre" in plain or "dessert" in plain:
        return DESSERTS
    if any(word in plain for word in ("complement", "acompan", "papa", "extra", "guarnicion")):
        return SIDES
    return GENERAL


def normalized_image(value: str | None, category_name: str) -> str:
    image = (value or "").strip()
    if not image:
        return default_image_for(category_name)
    parsed = urlsplit(image)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise BusinessError("La imagen debe ser una URL HTTP o HTTPS válida", 422)
    return image
