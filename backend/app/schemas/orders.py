from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class LineaPedidoIn(BaseModel):
    id_producto: int = Field(gt=0)
    cantidad: int = Field(gt=0, le=100)


class PedidoCreate(BaseModel):
    id_usuario: int = Field(gt=0)
    direccion_entrega: str = Field(min_length=5, max_length=300)
    latitud: float = Field(ge=-90, le=90)
    longitud: float = Field(ge=-180, le=180)
    items: list[LineaPedidoIn] = Field(min_length=1, max_length=50)
    metodo_pago: Literal["EFECTIVO", "TARJETA", "TRANSFERENCIA"] = "EFECTIVO"


class CotizacionIn(BaseModel):
    latitud: float = Field(ge=-90, le=90)
    longitud: float = Field(ge=-180, le=180)


class CotizacionOut(BaseModel):
    distancia_km: float
    tarifa_envio: Decimal
    eta_minutos: int
    llegada_estimada: datetime


class PedidoOut(CotizacionOut):
    id_pedido: int
    estado_pedido: str
    subtotal_productos: Decimal
    total: Decimal


class EstadoUpdate(BaseModel):
    estado_pedido: Literal["EN_PREPARACION", "LISTO"]


class EstadoOut(BaseModel):
    id_pedido: int
    estado_pedido: str


class ComandaOut(BaseModel):
    id_pedido: int
    fecha_hora: datetime
    estado_pedido: str
    prioridad: float
    espera_minutos: float
    preparacion_minutos: int
    grupo_plancha: str
    productos: list[str]


class UpsellIn(BaseModel):
    ids_productos: list[int] = Field(min_length=1, max_length=50)


class RecomendacionOut(BaseModel):
    id_producto: int
    nombre: str
    precio_base: Decimal
    pedidos_coincidentes: int
    confianza: float
