"""Catálogo y administración de productos y recetas."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Categoria, Ingrediente, Producto, Receta
from app.schemas.catalog import ProductoCreate, ProductoOut, ProductoUpdate, RecetaUpdate
from app.security import require_admin_key
from app.services.errors import BusinessError

router = APIRouter(prefix="/api/v1/productos", tags=["productos"])


def ensure_can_enable(db: Session, product_id: int) -> None:
    recipe = db.scalars(select(Receta).where(Receta.id_producto == product_id)).all()
    if not recipe:
        raise BusinessError("El producto necesita una receta antes de habilitarse", 409)
    ingredients = {i.id_ingrediente: i for i in db.scalars(
        select(Ingrediente).where(Ingrediente.id_ingrediente.in_({r.id_ingrediente for r in recipe}))
    ).all()}
    for line in recipe:
        ingredient = ingredients[line.id_ingrediente]
        if ingredient.stock_actual < max(ingredient.stock_minimo, line.cantidad_requerida):
            raise BusinessError(f"Stock insuficiente para habilitar: {ingredient.nombre_insumo}", 409)


@router.get("", response_model=list[ProductoOut])
def list_products(
    incluir_no_disponibles: bool = False,
    id_categoria: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
):
    stmt = select(Producto).join(Categoria).where(Categoria.activo.is_(True))
    if not incluir_no_disponibles:
        stmt = stmt.where(Producto.disponible.is_(True))
    if id_categoria is not None:
        stmt = stmt.where(Producto.id_categoria == id_categoria)
    return db.scalars(stmt.order_by(Producto.id_producto)).all()


@router.post("", response_model=ProductoOut, status_code=201, dependencies=[Depends(require_admin_key)])
def create_product(body: ProductoCreate, db: Session = Depends(get_db)):
    try:
        with db.begin():
            if db.get(Categoria, body.id_categoria) is None:
                raise HTTPException(status_code=404, detail="Categoría inexistente")
            if body.disponible:
                raise BusinessError("Crear primero la receta; el producto inicia deshabilitado", 409)
            product = Producto(**body.model_dump())
            db.add(product)
            db.flush()
        return product
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Nombre de producto duplicado") from exc


@router.put("/{id_producto}", response_model=ProductoOut, dependencies=[Depends(require_admin_key)])
def update_product(id_producto: int, body: ProductoUpdate, db: Session = Depends(get_db)):
    try:
        with db.begin():
            product = db.get(Producto, id_producto, with_for_update=True)
            if product is None:
                raise HTTPException(status_code=404, detail="Producto inexistente")
            changes = body.model_dump(exclude_unset=True)
            for required in ("id_categoria", "nombre", "precio_base", "disponible"):
                if required in changes and changes[required] is None:
                    raise BusinessError(f"{required} no puede ser nulo", 422)
            if "id_categoria" in changes and db.get(Categoria, changes["id_categoria"]) is None:
                raise HTTPException(status_code=404, detail="Categoría inexistente")
            if changes.get("disponible") is True:
                ensure_can_enable(db, id_producto)
            for key, value in changes.items():
                setattr(product, key, value)
            db.flush()
        return product
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Nombre de producto duplicado") from exc


@router.put("/{id_producto}/receta", response_model=ProductoOut, dependencies=[Depends(require_admin_key)])
def replace_recipe(id_producto: int, body: RecetaUpdate, db: Session = Depends(get_db)):
    ids = [line.id_ingrediente for line in body.ingredientes]
    if len(ids) != len(set(ids)):
        raise BusinessError("La receta repite un ingrediente", 422)
    with db.begin():
        # Se usa el mismo primer bloqueo que la explosión BOM.
        old_recipe = db.scalars(
            select(Receta).where(Receta.id_producto == id_producto)
            .order_by(Receta.id_receta).with_for_update()
        ).all()
        product = db.get(Producto, id_producto, with_for_update=True)
        if product is None:
            raise HTTPException(status_code=404, detail="Producto inexistente")
        existing = db.scalars(select(Ingrediente).where(Ingrediente.id_ingrediente.in_(ids))).all()
        if len(existing) != len(ids):
            raise HTTPException(status_code=404, detail="Ingrediente inexistente")
        for row in old_recipe:
            db.delete(row)
        db.flush()
        for line in body.ingredientes:
            db.add(Receta(id_producto=id_producto, **line.model_dump()))
        db.flush()
        product.disponible = False
    return product
