"""Catálogo y administración de productos y recetas."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Categoria, DetallePedido, Ingrediente, Producto, Receta
from app.schemas.catalog import CategoriaOut, ProductoCreate, ProductoOut, ProductoUpdate, RecetaLineaIn, RecetaUpdate
from app.security import require_admin_key
from app.services.errors import BusinessError
from app.services.product_images import default_image_for, normalized_image

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


def validate_recipe(db: Session, lines: list[RecetaLineaIn]) -> None:
    ids = [line.id_ingrediente for line in lines]
    if len(ids) != len(set(ids)):
        raise BusinessError("La receta repite un ingrediente", 422)
    if ids:
        existing = db.scalars(select(Ingrediente.id_ingrediente).where(Ingrediente.id_ingrediente.in_(ids))).all()
        if len(existing) != len(ids):
            raise HTTPException(status_code=404, detail="Ingrediente inexistente")


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


@router.get("/admin", response_model=list[ProductoOut], dependencies=[Depends(require_admin_key)])
def list_products_admin(db: Session = Depends(get_db)):
    """Incluye productos deshabilitados y categorías inactivas sin cambiar el menú público."""
    return db.scalars(select(Producto).order_by(Producto.id_producto.desc())).all()


@router.get("/categorias", response_model=list[CategoriaOut], dependencies=[Depends(require_admin_key)])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Categoria).order_by(Categoria.id_categoria)).all()


@router.get("/{id_producto}/receta", response_model=list[RecetaLineaIn], dependencies=[Depends(require_admin_key)])
def get_recipe(id_producto: int, db: Session = Depends(get_db)):
    if db.get(Producto, id_producto) is None:
        raise HTTPException(status_code=404, detail="Producto inexistente")
    rows = db.scalars(select(Receta).where(Receta.id_producto == id_producto).order_by(Receta.id_receta)).all()
    return [{"id_ingrediente": row.id_ingrediente, "cantidad_requerida": row.cantidad_requerida} for row in rows]


@router.post("", response_model=ProductoOut, status_code=201, dependencies=[Depends(require_admin_key)])
def create_product(body: ProductoCreate, db: Session = Depends(get_db)):
    try:
        with db.begin():
            category = db.get(Categoria, body.id_categoria)
            if category is None:
                raise HTTPException(status_code=404, detail="Categoría inexistente")
            if body.disponible and not category.activo:
                raise BusinessError("No se puede publicar un producto en una categoría inactiva", 409)
            if body.disponible and not body.receta:
                raise BusinessError("Agrega una receta antes de publicar el producto", 409)
            validate_recipe(db, body.receta)
            values = body.model_dump(exclude={"receta"})
            values["nombre"] = values["nombre"].strip()
            if not values["nombre"]:
                raise BusinessError("El nombre no puede estar vacío", 422)
            values["imagen_url"] = normalized_image(values["imagen_url"], category.nombre_categoria)
            values["disponible"] = False
            product = Producto(**values)
            db.add(product)
            db.flush()
            for line in body.receta:
                db.add(Receta(id_producto=product.id_producto, **line.model_dump()))
            db.flush()
            if body.disponible:
                ensure_can_enable(db, product.id_producto)
                product.disponible = True
        return product
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Nombre de producto duplicado") from exc


@router.put("/{id_producto}", response_model=ProductoOut, dependencies=[Depends(require_admin_key)])
def update_product(id_producto: int, body: ProductoUpdate, db: Session = Depends(get_db)):
    try:
        with db.begin():
            # Mismo orden de bloqueo de recetas y producto que la explosión BOM.
            old_recipe = db.scalars(
                select(Receta).where(Receta.id_producto == id_producto)
                .order_by(Receta.id_receta).with_for_update()
            ).all()
            product = db.get(Producto, id_producto, with_for_update=True)
            if product is None:
                raise HTTPException(status_code=404, detail="Producto inexistente")
            changes = body.model_dump(exclude_unset=True)
            new_recipe = body.receta if "receta" in changes else None
            changes.pop("receta", None)
            for required in ("id_categoria", "nombre", "precio_base", "disponible"):
                if required in changes and changes[required] is None:
                    raise BusinessError(f"{required} no puede ser nulo", 422)
            category = db.get(Categoria, changes.get("id_categoria", product.id_categoria))
            if category is None:
                raise HTTPException(status_code=404, detail="Categoría inexistente")
            was_default = product.imagen_url == default_image_for(product.categoria.nombre_categoria)
            if "imagen_url" in changes:
                image = changes["imagen_url"]
                if ("id_categoria" in changes and was_default and image == product.imagen_url):
                    image = None
                changes["imagen_url"] = normalized_image(image, category.nombre_categoria)
            elif "id_categoria" in changes and was_default:
                changes["imagen_url"] = default_image_for(category.nombre_categoria)
            if "nombre" in changes:
                changes["nombre"] = changes["nombre"].strip()
                if not changes["nombre"]:
                    raise BusinessError("El nombre no puede estar vacío", 422)
            desired_available = changes.pop("disponible", product.disponible)
            if desired_available and not category.activo:
                raise BusinessError("No se puede publicar un producto en una categoría inactiva", 409)
            if new_recipe is not None:
                validate_recipe(db, new_recipe)
                for row in old_recipe:
                    db.delete(row)
                db.flush()
                for line in new_recipe:
                    db.add(Receta(id_producto=id_producto, **line.model_dump()))
                db.flush()
            for key, value in changes.items():
                setattr(product, key, value)
            if desired_available:
                ensure_can_enable(db, id_producto)
            product.disponible = desired_available
            db.flush()
        return product
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="No se pudo actualizar el producto; verifica nombre y receta") from exc


@router.delete("/{id_producto}", status_code=204, dependencies=[Depends(require_admin_key)])
def delete_product(id_producto: int, db: Session = Depends(get_db)):
    try:
        with db.begin():
            recipe = db.scalars(
                select(Receta).where(Receta.id_producto == id_producto)
                .order_by(Receta.id_receta).with_for_update()
            ).all()
            product = db.get(Producto, id_producto, with_for_update=True)
            if product is None:
                raise HTTPException(status_code=404, detail="Producto inexistente")
            sold = db.scalar(select(DetallePedido.id_detalle).where(DetallePedido.id_producto == id_producto).limit(1))
            if sold is not None:
                raise BusinessError("Este producto tiene pedidos registrados; deshabilítalo para conservar el historial", 409)
            for row in recipe:
                db.delete(row)
            db.flush()
            db.delete(product)
            db.flush()
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="El producto tiene referencias; deshabilítalo en lugar de eliminarlo") from exc


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
