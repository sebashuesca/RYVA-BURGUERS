from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductoCreate(BaseModel):
    id_categoria: int = Field(gt=0)
    nombre: str = Field(min_length=1, max_length=120)
    descripcion: str | None = Field(default=None, max_length=500)
    precio_base: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    imagen_url: str | None = Field(default=None, max_length=500)
    disponible: bool = False


class ProductoUpdate(BaseModel):
    id_categoria: int | None = Field(default=None, gt=0)
    nombre: str | None = Field(default=None, min_length=1, max_length=120)
    descripcion: str | None = Field(default=None, max_length=500)
    precio_base: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    imagen_url: str | None = Field(default=None, max_length=500)
    disponible: bool | None = None


class ProductoOut(ProductoCreate):
    model_config = ConfigDict(from_attributes=True)
    id_producto: int


class IngredienteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id_ingrediente: int
    nombre_insumo: str
    unidad_medida: str
    stock_actual: Decimal
    stock_minimo: Decimal
    alerta_stock: bool


class IngredienteUpdate(BaseModel):
    stock_actual: Decimal = Field(ge=0, max_digits=12, decimal_places=3)
    stock_minimo: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=3)


class RecetaLineaIn(BaseModel):
    id_ingrediente: int = Field(gt=0)
    cantidad_requerida: Decimal = Field(gt=0, max_digits=12, decimal_places=3)


class RecetaUpdate(BaseModel):
    ingredientes: list[RecetaLineaIn] = Field(min_length=1, max_length=100)
