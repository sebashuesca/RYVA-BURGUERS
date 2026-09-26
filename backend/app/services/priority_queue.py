"""Cola de cocina con prioridad dinámica y lotes de plancha."""

from dataclasses import dataclass
from datetime import datetime
from heapq import heappop, heappush


@dataclass(frozen=True)
class ActiveOrder:
    id_pedido: int
    fecha_hora: datetime
    estado_pedido: str
    preparacion_minutos: int
    grupo_plancha: str
    productos: list[str]


@dataclass(frozen=True)
class RankedOrder:
    order: ActiveOrder
    prioridad: float
    espera_minutos: float


def rank_orders(
    orders: list[ActiveOrder],
    now: datetime,
    w_wait: float = 1.0,
    w_prep: float = 0.35,
    w_urgency: float = 3.0,
) -> list[RankedOrder]:
    """P = w1*espera + w2*preparación + w3*urgencia.

    Dentro de bandas de cinco puntos se juntan pedidos con el mismo insumo
    de plancha; entre bandas prevalece la prioridad. El heap evita ordenar
    manualmente una cola que cambia en cada consulta.
    """
    heap: list[tuple[float, str, float, datetime, int, RankedOrder]] = []
    for order in orders:
        wait = max(0.0, (now - order.fecha_hora).total_seconds() / 60)
        urgency = min(10.0, wait / max(order.preparacion_minutos, 1))
        if order.estado_pedido == "EN_PREPARACION":
            urgency += 2.0
        score = w_wait * wait + w_prep * order.preparacion_minutos + w_urgency * urgency
        ranked = RankedOrder(order, round(score, 2), round(wait, 2))
        band = int(score // 5)
        heappush(heap, (-band, order.grupo_plancha, -score, order.fecha_hora, order.id_pedido, ranked))
    return [heappop(heap)[-1] for _ in range(len(heap))]
