-- RIVA BURGUERS | MySQL 8.0.16+ | Ejecutar en una base de datos vacía.
-- En Aiven, seleccionar antes la base creada en la consola (USE nombre_bd).
-- Todas las tablas tienen PK, incluso cuando sql_require_primary_key está activo.
SET NAMES utf8mb4;

CREATE TABLE roles (
  id_rol SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_rol VARCHAR(40) NOT NULL,
  CONSTRAINT uq_roles_nombre UNIQUE (nombre_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE usuarios (
  id_usuario BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_rol SMALLINT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(25),
  CONSTRAINT uq_usuarios_email UNIQUE (email),
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
  INDEX ix_usuarios_rol (id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE categorias (
  id_categoria SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_categoria VARCHAR(80) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_categorias_nombre UNIQUE (nombre_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE productos (
  id_producto BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_categoria SMALLINT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  descripcion VARCHAR(500),
  precio_base DECIMAL(10,2) NOT NULL,
  imagen_url VARCHAR(500),
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_productos_nombre UNIQUE (nombre),
  CONSTRAINT ck_productos_precio CHECK (precio_base >= 0),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
  INDEX ix_productos_categoria_disponible (id_categoria, disponible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ingredientes (
  id_ingrediente BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_insumo VARCHAR(120) NOT NULL,
  unidad_medida ENUM('g','ml','pieza') NOT NULL,
  stock_actual DECIMAL(12,3) NOT NULL DEFAULT 0,
  stock_minimo DECIMAL(12,3) NOT NULL DEFAULT 0,
  CONSTRAINT uq_ingredientes_nombre UNIQUE (nombre_insumo),
  CONSTRAINT ck_ingredientes_stock CHECK (stock_actual >= 0 AND stock_minimo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE recetas (
  id_receta BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_producto BIGINT UNSIGNED NOT NULL,
  id_ingrediente BIGINT UNSIGNED NOT NULL,
  cantidad_requerida DECIMAL(12,3) NOT NULL,
  CONSTRAINT uq_recetas_producto_ingrediente UNIQUE (id_producto, id_ingrediente),
  CONSTRAINT ck_recetas_cantidad CHECK (cantidad_requerida > 0),
  CONSTRAINT fk_recetas_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
  CONSTRAINT fk_recetas_ingrediente FOREIGN KEY (id_ingrediente) REFERENCES ingredientes(id_ingrediente),
  INDEX ix_recetas_ingrediente (id_ingrediente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pedidos (
  id_pedido BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario BIGINT UNSIGNED NOT NULL,
  fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado_pedido ENUM('PENDIENTE','EN_PREPARACION','LISTO','EN_CAMINO','ENTREGADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  direccion_entrega VARCHAR(300) NOT NULL,
  latitud DECIMAL(10,7) NOT NULL,
  longitud DECIMAL(10,7) NOT NULL,
  CONSTRAINT ck_pedidos_total CHECK (total >= 0),
  CONSTRAINT ck_pedidos_lat CHECK (latitud BETWEEN -90 AND 90),
  CONSTRAINT ck_pedidos_lon CHECK (longitud BETWEEN -180 AND 180),
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  INDEX ix_pedidos_usuario_fecha (id_usuario, fecha_hora),
  INDEX ix_pedidos_fecha_estado (fecha_hora, estado_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE detalle_pedido (
  id_detalle BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_pedido BIGINT UNSIGNED NOT NULL,
  id_producto BIGINT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  CONSTRAINT uq_detalle_pedido_producto UNIQUE (id_pedido, id_producto),
  CONSTRAINT ck_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT ck_detalle_precio CHECK (precio_unitario >= 0),
  CONSTRAINT fk_detalle_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
  CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
  INDEX ix_detalle_producto (id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pagos (
  id_pago BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_pedido BIGINT UNSIGNED NOT NULL,
  metodo_pago ENUM('EFECTIVO','TARJETA','TRANSFERENCIA') NOT NULL,
  estado_pago ENUM('PENDIENTE','APROBADO','RECHAZADO','REEMBOLSADO') NOT NULL DEFAULT 'PENDIENTE',
  transaccion_id VARCHAR(120) NULL,
  monto DECIMAL(12,2) NOT NULL,
  CONSTRAINT uq_pagos_transaccion UNIQUE (transaccion_id),
  CONSTRAINT ck_pagos_monto CHECK (monto >= 0),
  CONSTRAINT fk_pagos_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
  INDEX ix_pagos_pedido (id_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE seguimiento_clientes (
  id_seguimiento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario BIGINT UNSIGNED NOT NULL,
  id_pedido BIGINT UNSIGNED NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  mensaje VARCHAR(500) NOT NULL,
  CONSTRAINT fk_seguimiento_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_seguimiento_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
  INDEX ix_seguimiento_pedido_fecha (id_pedido, fecha_registro),
  INDEX ix_seguimiento_usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Entidad independiente para el UNION académico de contactos.
CREATE TABLE proveedores (
  id_proveedor BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  razon_social VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  telefono VARCHAR(25),
  CONSTRAINT uq_proveedores_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
