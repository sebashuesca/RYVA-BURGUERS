"""Consulta y ajuste manual del inventario."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Ingrediente, Producto, Receta
from app.schemas.catalog import IngredienteOut, IngredienteUpdate
from app.security import require_admin_key

router = APIRouter(prefix="/api/v1/ingredientes", tags=["ingredientes"])


def to_out(item: Ingrediente) -> IngredienteOut:
    return IngredienteOut(
        id_ingrediente=item.id_ingrediente,
        nombre_insumo=item.nombre_insumo,
        unidad_medida=item.unidad_medida,
        stock_actual=item.stock_actual,
        stock_minimo=item.stock_minimo,
        alerta_stock=item.stock_actual < item.stock_minimo,
    )


@router.get("", response_model=list[IngredienteOut], dependencies=[Depends(require_admin_key)])
def list_ingredients(db: Session = Depends(get_db)):
    return [to_out(item) for item in db.scalars(select(Ingrediente).order_by(Ingrediente.id_ingrediente)).all()]


@router.put("/{id_ingrediente}", response_model=IngredienteOut, dependencies=[Depends(require_admin_key)])
def update_ingredient(id_ingrediente: int, body: IngredienteUpdate, db: Session = Depends(get_db)):
    with db.begin():
        item = db.get(Ingrediente, id_ingrediente, with_for_update=True)
        if item is None:
            raise HTTPException(status_code=404, detail="Ingrediente inexistente")
        item.stock_actual = body.stock_actual
        if body.stock_minimo is not None:
            item.stock_minimo = body.stock_minimo
        if item.stock_actual < item.stock_minimo:
            ids = sorted(set(db.scalars(
                select(Receta.id_producto).where(Receta.id_ingrediente == id_ingrediente)
            ).all()))
            for product in db.scalars(
                select(Producto).where(Producto.id_producto.in_(ids)).order_by(Producto.id_producto).with_for_update()
            ).all():
                product.disponible = False
        db.flush()
    return to_out(item)
