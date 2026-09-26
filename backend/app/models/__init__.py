"""Mapeo de las tablas creadas por database/01_schema.sql."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, Computed, DateTime, ForeignKey, Integer, Numeric, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Rol(Base):
    __tablename__ = "roles"
    id_rol: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    nombre_rol: Mapped[str] = mapped_column(String(40), unique=True)


class Usuario(Base):
    __tablename__ = "usuarios"
    id_usuario: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    id_rol: Mapped[int] = mapped_column(ForeignKey("roles.id_rol"))
    nombre: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    telefono: Mapped[str | None] = mapped_column(String(25))
    rol: Mapped[Rol] = relationship()


class Categoria(Base):
    __tablename__ = "categorias"
    id_categoria: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    nombre_categoria: Mapped[str] = mapped_column(String(80))
    activo: Mapped[bool] = mapped_column(Boolean)


class Producto(Base):
    __tablename__ = "productos"
    id_producto: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    id_categoria: Mapped[int] = mapped_column(ForeignKey("categorias.id_categoria"))
    nombre: Mapped[str] = mapped_column(String(120), unique=True)
    descripcion: Mapped[str | None] = mapped_column(String(500))
    precio_base: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    imagen_url: Mapped[str | None] = mapped_column(String(500))
    disponible: Mapped[bool] = mapped_column(Boolean)
    categoria: Mapped[Categoria] = relationship()


class Ingrediente(Base):
    __tablename__ = "ingredientes"
    id_ingrediente: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    nombre_insumo: Mapped[str] = mapped_column(String(120), unique=True)
    unidad_medida: Mapped[str] = mapped_column(String(10))
    stock_actual: Mapped[Decimal] = mapped_column(Numeric(12, 3))
    stock_minimo: Mapped[Decimal] = mapped_column(Numeric(12, 3))


class Receta(Base):
    __tablename__ = "recetas"
    id_receta: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    id_producto: Mapped[int] = mapped_column(ForeignKey("productos.id_producto"))
    id_ingrediente: Mapped[int] = mapped_column(ForeignKey("ingredientes.id_ingrediente"))
    cantidad_requerida: Mapped[Decimal] = mapped_column(Numeric(12, 3))


class Pedido(Base):
    __tablename__ = "pedidos"
    id_pedido: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuarios.id_usuario"))
    fecha_hora: Mapped[datetime] = mapped_column(DateTime)
    estado_pedido: Mapped[str] = mapped_column(String(20))
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    direccion_entrega: Mapped[str] = mapped_column(String(300))
    latitud: Mapped[Decimal] = mapped_column(Numeric(10, 7))
    longitud: Mapped[Decimal] = mapped_column(Numeric(10, 7))
    detalles: Mapped[list["DetallePedido"]] = relationship(back_populates="pedido")


class DetallePedido(Base):
    __tablename__ = "detalle_pedido"
    id_detalle: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    id_pedido: Mapped[int] = mapped_column(ForeignKey("pedidos.id_pedido"))
    id_producto: Mapped[int] = mapped_column(ForeignKey("productos.id_producto"))
    cantidad: Mapped[int] = mapped_column(Integer)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), Computed("cantidad * precio_unitario", persisted=True)
    )
    pedido: Mapped[Pedido] = relationship(back_populates="detalles")
    producto: Mapped[Producto] = relationship()


class Pago(Base):
    __tablename__ = "pagos"
    id_pago: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    id_pedido: Mapped[int] = mapped_column(ForeignKey("pedidos.id_pedido"))
    metodo_pago: Mapped[str] = mapped_column(String(20))
    estado_pago: Mapped[str] = mapped_column(String(20))
    transaccion_id: Mapped[str | None] = mapped_column(String(120))
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2))


class SeguimientoCliente(Base):
    __tablename__ = "seguimiento_clientes"
    id_seguimiento: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuarios.id_usuario"))
    id_pedido: Mapped[int] = mapped_column(ForeignKey("pedidos.id_pedido"))
    fecha_registro: Mapped[datetime] = mapped_column(DateTime)
    mensaje: Mapped[str] = mapped_column(String(500))


class Proveedor(Base):
    __tablename__ = "proveedores"
    id_proveedor: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    razon_social: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    telefono: Mapped[str | None] = mapped_column(String(25))
