-- Datos ficticios de demostración con productos y cantidades plausibles.
-- Ejecutar una sola vez, después de 02_routines_triggers.sql.
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO roles (id_rol, nombre_rol) VALUES
  (1, 'CLIENTE'), (2, 'ADMIN'), (3, 'COCINA'),
  (4, 'REPARTIDOR'), (5, 'CAJERO');

-- Hash PBKDF2-SHA256 de la contraseña de demostración RivaDemo2026!.
-- Sustituir cuentas y contraseñas antes de usar el sistema con personas reales.
INSERT INTO usuarios (id_usuario, id_rol, nombre, email, password_hash, telefono) VALUES
  (1, 1, 'Ana López', 'ana@example.test', 'pbkdf2_sha256$600000$cml2YS1kZW1vLXNlZWQtMjAyNg==$EcEVD/oPiGFoJkAlPpSQpSlfErO1k5/bWl6u/+1VwZY=', '5550001001'),
  (2, 1, 'Luis Ramírez', 'luis@example.test', 'pbkdf2_sha256$600000$cml2YS1kZW1vLXNlZWQtMjAyNg==$EcEVD/oPiGFoJkAlPpSQpSlfErO1k5/bWl6u/+1VwZY=', '5550001002'),
  (3, 1, 'María Torres', 'maria@example.test', 'pbkdf2_sha256$600000$cml2YS1kZW1vLXNlZWQtMjAyNg==$EcEVD/oPiGFoJkAlPpSQpSlfErO1k5/bWl6u/+1VwZY=', '5550001003'),
  (4, 1, 'Diego Pérez', 'diego@example.test', 'pbkdf2_sha256$600000$cml2YS1kZW1vLXNlZWQtMjAyNg==$EcEVD/oPiGFoJkAlPpSQpSlfErO1k5/bWl6u/+1VwZY=', '5550001004'),
  (5, 1, 'Sofía García', 'sofia@example.test', 'pbkdf2_sha256$600000$cml2YS1kZW1vLXNlZWQtMjAyNg==$EcEVD/oPiGFoJkAlPpSQpSlfErO1k5/bWl6u/+1VwZY=', '5550001005'),
  (6, 2, 'Admin Riva', 'admin@example.test', 'pbkdf2_sha256$600000$cml2YS1kZW1vLXNlZWQtMjAyNg==$EcEVD/oPiGFoJkAlPpSQpSlfErO1k5/bWl6u/+1VwZY=', NULL),
  (7, 3, 'Operador Cocina', 'cocina@example.test', 'pbkdf2_sha256$600000$cml2YS1kZW1vLXNlZWQtMjAyNg==$EcEVD/oPiGFoJkAlPpSQpSlfErO1k5/bWl6u/+1VwZY=', NULL);

INSERT INTO categorias (id_categoria, nombre_categoria, activo) VALUES
  (1, 'Hamburguesas', TRUE), (2, 'Papas', TRUE),
  (3, 'Bebidas', TRUE), (4, 'Extras', TRUE), (5, 'Combos', TRUE);

INSERT INTO productos (id_producto, id_categoria, nombre, descripcion, precio_base, imagen_url, disponible) VALUES
  (1, 1, 'Riva Clásica', 'Carne smash, cheddar, lechuga y salsa Riva.', 159.00, NULL, TRUE),
  (2, 1, 'Doble Smash', 'Dos carnes smash con doble cheddar y salsa Riva.', 189.00, NULL, TRUE),
  (3, 1, 'BBQ Ahumada', 'Carne smash, tocino, cheddar y salsa BBQ.', 179.00, NULL, TRUE),
  (4, 2, 'Papas Trufadas', 'Papas crujientes con aceite de trufa.', 89.00, NULL, FALSE),
  (5, 2, 'Papas Clásicas', 'Papas doradas con sal.', 69.00, NULL, TRUE),
  (6, 3, 'Cola Artesanal', 'Bebida de cola de 355 ml.', 39.00, NULL, TRUE),
  (7, 3, 'Limonada Natural', 'Limonada fresca de 400 ml.', 49.00, NULL, TRUE),
  (8, 4, 'Extra Cheddar', 'Porción adicional de queso cheddar.', 25.00, NULL, TRUE);

INSERT INTO ingredientes (id_ingrediente, nombre_insumo, unidad_medida, stock_actual, stock_minimo) VALUES
  (1, 'Carne molida de res', 'g', 20000, 3000),
  (2, 'Pan brioche', 'pieza', 100, 20),
  (3, 'Queso cheddar', 'g', 6000, 500),
  (4, 'Lechuga fresca', 'g', 3000, 300),
  (5, 'Tocino', 'g', 3000, 300),
  (6, 'Salsa BBQ', 'g', 2500, 200),
  (7, 'Papa', 'g', 15000, 2000),
  (8, 'Aceite de trufa', 'ml', 12, 20),
  (9, 'Concentrado de cola', 'ml', 12000, 1000),
  (10, 'Limón', 'g', 5000, 500),
  (11, 'Agua purificada', 'ml', 20000, 2000),
  (12, 'Salsa Riva', 'g', 2000, 200),
  (13, 'Aceite vegetal', 'ml', 5000, 500);

INSERT INTO recetas (id_producto, id_ingrediente, cantidad_requerida) VALUES
  (1,1,150), (1,2,1), (1,3,30), (1,4,20), (1,12,25),
  (2,1,240), (2,2,1), (2,3,60), (2,12,30),
  (3,1,150), (3,2,1), (3,3,30), (3,5,40), (3,6,30),
  (4,7,200), (4,8,8), (4,13,20),
  (5,7,200), (5,13,20),
  (6,9,355),
  (7,10,70), (7,11,330),
  (8,3,30);

INSERT INTO proveedores (id_proveedor, razon_social, email, telefono) VALUES
  (1, 'Carnes Norte Demo', 'carnes@example.test', '5551002001'),
  (2, 'Panadería Central Demo', 'pan@example.test', '5551002002'),
  (3, 'Lácteos Sierra Demo', 'lacteos@example.test', '5551002003'),
  (4, 'Huerta Verde Demo', 'huerta@example.test', '5551002004'),
  (5, 'Bebidas Locales Demo', 'bebidas@example.test', '5551002005');

-- La fecha fija permite reproducir consultas académicas; cambiar al año
-- vigente si se desea demostrar sp_reporte_clientes_q1 después de 2026.
INSERT INTO pedidos (id_pedido, id_usuario, fecha_hora, estado_pedido, total, direccion_entrega, latitud, longitud) VALUES
  (1, 1, '2026-01-12 13:05:00', 'ENTREGADO', 287.00, 'Calle Demo 101, Ciudad de México', 19.4326000, -99.1332000),
  (2, 2, '2026-02-08 19:20:00', 'ENTREGADO', 238.00, 'Calle Demo 102, Ciudad de México', 19.4331000, -99.1340000),
  (3, 3, '2026-03-14 14:40:00', 'ENTREGADO', 297.00, 'Calle Demo 103, Ciudad de México', 19.4319000, -99.1325000),
  (4, 4, '2026-09-25 20:15:00', 'EN_PREPARACION', 506.00, 'Calle Demo 104, Ciudad de México', 19.4340000, -99.1350000),
  (5, 5, '2026-09-26 12:10:00', 'PENDIENTE', 277.00, 'Calle Demo 105, Ciudad de México', 19.4309000, -99.1319000);

INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES
  (1,1,1,159.00), (1,4,1,89.00), (1,6,1,39.00),
  (2,2,1,189.00), (2,7,1,49.00),
  (3,3,1,179.00), (3,5,1,69.00), (3,7,1,49.00),
  (4,2,2,189.00), (4,8,2,25.00), (4,6,2,39.00),
  (5,1,1,159.00), (5,5,1,69.00), (5,7,1,49.00);

INSERT INTO pagos (id_pago, id_pedido, metodo_pago, estado_pago, transaccion_id, monto) VALUES
  (1,1,'TARJETA','APROBADO','demo-tx-001',287.00),
  (2,2,'TRANSFERENCIA','APROBADO','demo-tx-002',238.00),
  (3,3,'EFECTIVO','APROBADO',NULL,297.00),
  (4,4,'TARJETA','APROBADO','demo-tx-004',506.00),
  (5,5,'EFECTIVO','PENDIENTE',NULL,277.00);

-- seguimiento_clientes obtiene automáticamente cinco filas del trigger.
COMMIT;
