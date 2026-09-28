"""Distancia geográfica y tarifa de envío sin límite de cobertura."""

from decimal import Decimal, ROUND_HALF_UP
from math import asin, ceil, cos, isfinite, radians, sin, sqrt

from app.config import Settings
from app.services.errors import BusinessError

EARTH_RADIUS_KM = 6371.0088


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    if not all(isfinite(v) for v in (lat1, lon1, lat2, lon2)):
        raise BusinessError("Coordenadas no válidas", 422)
    phi1, phi2 = radians(lat1), radians(lat2)
    delta_phi = radians(lat2 - lat1)
    delta_lambda = radians(lon2 - lon1)
    a = sin(delta_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * asin(sqrt(min(1.0, max(0.0, a))))


def quote_delivery(lat: float, lon: float, settings: Settings) -> tuple[float, Decimal]:
    km = distance_km(settings.kitchen_latitude, settings.kitchen_longitude, lat, lon)
    # Se factura cada kilómetro iniciado y se conserva moneda DECIMAL.
    fee = Decimal(str(settings.delivery_base_fee)) + Decimal(ceil(km)) * Decimal(str(settings.delivery_fee_per_km))
    return round(km, 3), fee.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
