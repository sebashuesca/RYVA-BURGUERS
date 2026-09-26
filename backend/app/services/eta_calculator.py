"""ETA: saturación de estaciones + tránsito + empaque."""

from datetime import datetime, timedelta, timezone
from math import ceil


PREP_BY_CATEGORY = {
    "Hamburguesas": 12,
    "Papas": 7,
    "Bebidas": 2,
    "Extras": 1,
    "Combos": 15,
}


def preparation_minutes(items: list[tuple[str, int]]) -> int:
    """Tiempo base máximo y dos minutos por unidad adicional del pedido."""
    if not items:
        return 0
    base = max(PREP_BY_CATEGORY.get(category, 10) for category, _ in items)
    units = sum(quantity for _, quantity in items)
    return base + max(0, units - 1) * 2


def estimate_eta(
    active_prep_minutes: list[int],
    distance_km: float,
    stations: int,
    speed_kmh: float,
    now: datetime | None = None,
) -> tuple[int, datetime]:
    if stations < 1 or speed_kmh <= 0 or distance_km < 0:
        raise ValueError("Parámetros de ETA inválidos")
    # Cada estación absorbe una fracción de la carga; 5 minutos de empaque.
    kitchen = ceil(sum(active_prep_minutes) / stations)
    transit = ceil(distance_km / speed_kmh * 60) + 5
    minutes = kitchen + transit
    instant = now or datetime.now(timezone.utc)
    return minutes, instant + timedelta(minutes=minutes)
