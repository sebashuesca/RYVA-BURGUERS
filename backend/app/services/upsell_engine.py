"""Apriori Lite: coocurrencia de complementos en pedidos anteriores."""

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session, aliased

from app.models import Categoria, DetallePedido, Pedido, Producto

COMPLEMENT_CATEGORIES = ("Papas", "Bebidas", "Extras")


def recommend(db: Session, selected_ids: list[int], limit: int = 3) -> list[dict]:
    selected = set(selected_ids)
    first = aliased(DetallePedido)
    second = aliased(DetallePedido)
    history_count = db.scalar(
        select(func.count(distinct(first.id_pedido)))
        .join(Pedido, Pedido.id_pedido == first.id_pedido)
        .where(first.id_producto.in_(selected), Pedido.estado_pedido != "CANCELADO")
    ) or 0

    rows = db.execute(
        select(Producto, func.count(distinct(first.id_pedido)).label("coincidencias"))
        .join(Categoria, Categoria.id_categoria == Producto.id_categoria)
        .join(second, second.id_producto == Producto.id_producto)
        .join(first, first.id_pedido == second.id_pedido)
        .join(Pedido, Pedido.id_pedido == first.id_pedido)
        .where(
            first.id_producto.in_(selected),
            Producto.id_producto.not_in(selected),
            Producto.disponible.is_(True),
            Categoria.activo.is_(True),
            Categoria.nombre_categoria.in_(COMPLEMENT_CATEGORIES),
            Pedido.estado_pedido != "CANCELADO",
        )
        .group_by(Producto.id_producto)
        .order_by(func.count(distinct(first.id_pedido)).desc(), Producto.id_producto)
        .limit(limit)
    ).all()
    return [
        {
            "id_producto": product.id_producto,
            "nombre": product.nombre,
            "precio_base": product.precio_base,
            "pedidos_coincidentes": count,
            "confianza": round(count / history_count, 3) if history_count else 0.0,
        }
        for product, count in rows
    ]
