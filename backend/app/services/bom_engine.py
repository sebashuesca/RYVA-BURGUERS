"""Explosión BOM con bloqueos de fila y una sola transacción del pedido."""

from collections import defaultdict
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Categoria, Ingrediente, Producto, Receta
from app.services.errors import BusinessError


def reserve_ingredients(db: Session, quantities: dict[int, int]) -> tuple[dict[int, Producto], Decimal]:
    """Descuenta insumos; quien llama abre y confirma o revierte la transacción.

    Todos los ingredientes se bloquean en orden de ID antes de los productos.
    Así dos pedidos simultáneos no pueden gastar la misma última porción.
    """
    product_ids = sorted(quantities)
    recipes = db.scalars(
        select(Receta).where(Receta.id_producto.in_(product_ids))
        .order_by(Receta.id_receta).with_for_update()
    ).all()
    recipe_products = {row.id_producto for row in recipes}
    if recipe_products != set(product_ids):
        raise BusinessError("Hay productos sin receta configurada", 409)

    demand: dict[int, Decimal] = defaultdict(Decimal)
    for row in recipes:
        demand[row.id_ingrediente] += row.cantidad_requerida * quantities[row.id_producto]

    ingredient_ids = sorted(demand)
    ingredients = db.scalars(
        select(Ingrediente)
        .where(Ingrediente.id_ingrediente.in_(ingredient_ids))
        .order_by(Ingrediente.id_ingrediente)
        .with_for_update()
    ).all()
    if len(ingredients) != len(ingredient_ids):
        raise BusinessError("La receta contiene un insumo inexistente", 409)

    # También se bloquean los otros productos afectados por esos insumos.
    affected_ids = sorted(set(db.scalars(
        select(Receta.id_producto).where(Receta.id_ingrediente.in_(ingredient_ids))
    ).all()))
    products = db.scalars(
        select(Producto)
        .where(Producto.id_producto.in_(affected_ids))
        .order_by(Producto.id_producto)
        .with_for_update()
    ).all()
    product_by_id = {p.id_producto: p for p in products}
    categories = {c.id_categoria: c for c in db.scalars(select(Categoria).where(
        Categoria.id_categoria.in_({product_by_id[pid].id_categoria for pid in product_ids})
    )).all()}
    for pid in product_ids:
        product = product_by_id[pid]
        if not product.disponible or not categories[product.id_categoria].activo:
            raise BusinessError(f"Producto no disponible: {product.nombre}", 409)

    low_ids: set[int] = set()
    for ingredient in ingredients:
        needed = demand[ingredient.id_ingrediente]
        if ingredient.stock_actual < needed:
            raise BusinessError(f"Stock insuficiente: {ingredient.nombre_insumo}", 409)
        ingredient.stock_actual -= needed
        if ingredient.stock_actual < ingredient.stock_minimo:
            low_ids.add(ingredient.id_ingrediente)

    if low_ids:
        disabled_ids = set(db.scalars(
            select(Receta.id_producto).where(Receta.id_ingrediente.in_(low_ids))
        ).all())
        for pid in disabled_ids:
            product_by_id[pid].disponible = False

    subtotal = sum((product_by_id[pid].precio_base * qty for pid, qty in quantities.items()), Decimal("0.00"))
    db.flush()
    return product_by_id, subtotal
