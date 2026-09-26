"""Checkout, cotización, estados y tablero KDS."""

from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.config import get_settings
from app.database import get_db
from app.models import DetallePedido, Ingrediente, Pago, Pedido, Producto, Receta, Usuario
from app.schemas.orders import (
    ComandaOut, CotizacionIn, CotizacionOut, EstadoOut, EstadoUpdate,
    PedidoCreate, PedidoOut,
)
from app.security import require_admin_key
from app.services.bom_engine import reserve_ingredients
from app.services.errors import BusinessError
from app.services.eta_calculator import estimate_eta, preparation_minutes
from app.services.haversine import quote_delivery
from app.services.priority_queue import ActiveOrder, rank_orders

router = APIRouter(prefix="/api/v1/pedidos", tags=["pedidos"])


def active_orders(db: Session) -> list[Pedido]:
    return db.scalars(
        select(Pedido)
        .options(selectinload(Pedido.detalles).joinedload(DetallePedido.producto).joinedload(Producto.categoria))
        .where(Pedido.estado_pedido.in_(("PENDIENTE", "EN_PREPARACION")))
        .order_by(Pedido.fecha_hora, Pedido.id_pedido)
    ).all()


def prep_for_order(order: Pedido) -> int:
    items = [(line.producto.categoria.nombre_categoria, line.cantidad) for line in order.detalles]
    return preparation_minutes(items)


def eta_for(db: Session, km: float) -> tuple[int, datetime]:
    settings = get_settings()
    prep = [prep_for_order(order) for order in active_orders(db)]
    return estimate_eta(prep, km, settings.kitchen_stations, settings.delivery_speed_kmh)


@router.post("/cotizar", response_model=CotizacionOut)
def quote(body: CotizacionIn, db: Session = Depends(get_db)):
    km, fee = quote_delivery(body.latitud, body.longitud, get_settings())
    minutes, arrival = eta_for(db, km)
    return CotizacionOut(distancia_km=km, tarifa_envio=fee, eta_minutos=minutes, llegada_estimada=arrival)


@router.post("", response_model=PedidoOut, status_code=201)
def create_order(body: PedidoCreate, db: Session = Depends(get_db)):
    km, fee = quote_delivery(body.latitud, body.longitud, get_settings())
    quantities: dict[int, int] = defaultdict(int)
    for line in body.items:
        quantities[line.id_producto] += line.cantidad
    if any(quantity > 100 for quantity in quantities.values()):
        raise BusinessError("Máximo 100 unidades por producto", 422)

    with db.begin():
        user = db.get(Usuario, body.id_usuario)
        if user is None:
            raise HTTPException(status_code=404, detail="Cliente inexistente")
        if user.rol.nombre_rol != "CLIENTE":
            raise BusinessError("El usuario indicado no es cliente", 422)
        products, subtotal = reserve_ingredients(db, dict(quantities))
        total = subtotal + fee
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        order = Pedido(
            id_usuario=user.id_usuario,
            fecha_hora=now_utc,
            estado_pedido="PENDIENTE",
            total=total,
            direccion_entrega=body.direccion_entrega,
            latitud=body.latitud,
            longitud=body.longitud,
        )
        db.add(order)
        db.flush()  # Activa trg_pedidos_ai del Módulo 1.
        for pid, quantity in quantities.items():
            db.add(DetallePedido(
                id_pedido=order.id_pedido,
                id_producto=pid,
                cantidad=quantity,
                precio_unitario=products[pid].precio_base,
            ))
        db.add(Pago(
            id_pedido=order.id_pedido,
            metodo_pago=body.metodo_pago,
            estado_pago="PENDIENTE",
            monto=total,
        ))
        db.flush()
        # El ETA se obtiene antes del COMMIT para no confirmar sin respuesta.
        minutes, arrival = eta_for(db, km)

    return PedidoOut(
        id_pedido=order.id_pedido,
        estado_pedido=order.estado_pedido,
        subtotal_productos=subtotal,
        total=total,
        distancia_km=km,
        tarifa_envio=fee,
        eta_minutos=minutes,
        llegada_estimada=arrival,
    )


@router.get("/kds", response_model=list[ComandaOut], dependencies=[Depends(require_admin_key)])
def kitchen_queue(db: Session = Depends(get_db)):
    orders = active_orders(db)
    product_ids = {line.id_producto for order in orders for line in order.detalles}
    proteins: dict[int, set[str]] = defaultdict(set)
    if product_ids:
        rows = db.execute(
            select(Receta.id_producto, Ingrediente.nombre_insumo)
            .join(Ingrediente, Ingrediente.id_ingrediente == Receta.id_ingrediente)
            .where(Receta.id_producto.in_(product_ids))
        ).all()
        for pid, name in rows:
            if any(word in name.lower() for word in ("carne", "pollo", "pescado")):
                proteins[pid].add(name.lower())

    commands: list[ActiveOrder] = []
    for order in orders:
        grill = sorted({name for line in order.detalles for name in proteins[line.id_producto]})
        commands.append(ActiveOrder(
            id_pedido=order.id_pedido,
            fecha_hora=order.fecha_hora,
            estado_pedido=order.estado_pedido,
            preparacion_minutos=prep_for_order(order),
            grupo_plancha=" + ".join(grill) if grill else "SIN_PLANCHA",
            productos=[f"{line.cantidad} × {line.producto.nombre}" for line in order.detalles],
        ))
    ranked = rank_orders(commands, datetime.now(timezone.utc).replace(tzinfo=None))
    return [ComandaOut(
        id_pedido=row.order.id_pedido,
        fecha_hora=row.order.fecha_hora,
        estado_pedido=row.order.estado_pedido,
        prioridad=row.prioridad,
        espera_minutos=row.espera_minutos,
        preparacion_minutos=row.order.preparacion_minutos,
        grupo_plancha=row.order.grupo_plancha,
        productos=row.order.productos,
    ) for row in ranked]


@router.patch("/{id_pedido}/estado", response_model=EstadoOut, dependencies=[Depends(require_admin_key)])
def update_status(id_pedido: int, body: EstadoUpdate, db: Session = Depends(get_db)):
    transitions = {"PENDIENTE": "EN_PREPARACION", "EN_PREPARACION": "LISTO"}
    with db.begin():
        order = db.get(Pedido, id_pedido, with_for_update=True)
        if order is None:
            raise HTTPException(status_code=404, detail="Pedido inexistente")
        if transitions.get(order.estado_pedido) != body.estado_pedido:
            raise BusinessError("Transición de estado no permitida", 409)
        order.estado_pedido = body.estado_pedido
        db.flush()
    return EstadoOut(id_pedido=order.id_pedido, estado_pedido=order.estado_pedido)
