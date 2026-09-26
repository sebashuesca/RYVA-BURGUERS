-- Consultas académicas de lectura. Ejecutar después de 03_seed.sql.

-- JOIN de pedido, cliente, línea y producto.
SELECT p.id_pedido, p.fecha_hora, p.estado_pedido,
       u.nombre AS cliente, u.email,
       d.cantidad, pr.nombre AS producto, d.precio_unitario, d.subtotal
FROM pedidos p
JOIN usuarios u ON u.id_usuario = p.id_usuario
JOIN detalle_pedido d ON d.id_pedido = p.id_pedido
JOIN productos pr ON pr.id_producto = d.id_producto
ORDER BY p.fecha_hora DESC, p.id_pedido, d.id_detalle;

-- UNION deduplica por tipo, nombre, email y teléfono.
SELECT 'CLIENTE' AS tipo_contacto, u.nombre AS nombre,
       u.email, u.telefono
FROM usuarios u
JOIN roles r ON r.id_rol = u.id_rol AND r.nombre_rol = 'CLIENTE'
UNION
SELECT 'PROVEEDOR' AS tipo_contacto, pr.razon_social AS nombre,
       pr.email, pr.telefono
FROM proveedores pr
ORDER BY tipo_contacto, nombre;

-- Ventas por categoría, excluyendo pedidos cancelados. Cada línea se
-- contabiliza una sola vez y conserva su precio histórico.
SELECT c.nombre_categoria,
       SUM(d.cantidad) AS unidades_vendidas,
       SUM(d.subtotal) AS ventas_categoria
FROM detalle_pedido d
JOIN productos pr ON pr.id_producto = d.id_producto
JOIN categorias c ON c.id_categoria = pr.id_categoria
JOIN pedidos p ON p.id_pedido = d.id_pedido
WHERE p.estado_pedido <> 'CANCELADO'
GROUP BY c.id_categoria, c.nombre_categoria
ORDER BY ventas_categoria DESC, c.nombre_categoria;

-- Productos más vendidos dentro de cada categoría usando función de ventana.
WITH ventas_producto AS (
  SELECT c.id_categoria, c.nombre_categoria, pr.id_producto,
         pr.nombre AS producto, SUM(d.cantidad) AS unidades_vendidas,
         SUM(d.subtotal) AS ventas_producto
  FROM detalle_pedido d
  JOIN productos pr ON pr.id_producto = d.id_producto
  JOIN categorias c ON c.id_categoria = pr.id_categoria
  JOIN pedidos p ON p.id_pedido = d.id_pedido
  WHERE p.estado_pedido <> 'CANCELADO'
  GROUP BY c.id_categoria, c.nombre_categoria, pr.id_producto, pr.nombre
), clasificacion AS (
  SELECT ventas_producto.*,
         DENSE_RANK() OVER (
           PARTITION BY id_categoria
           ORDER BY unidades_vendidas DESC
         ) AS posicion
  FROM ventas_producto
)
SELECT nombre_categoria, producto, unidades_vendidas, ventas_producto
FROM clasificacion
WHERE posicion = 1
ORDER BY nombre_categoria, producto;

-- BETWEEN para rango cerrado de marcas temporales.
SELECT id_pedido, fecha_hora, estado_pedido, total
FROM pedidos
WHERE fecha_hora BETWEEN '2026-01-01 00:00:00' AND '2026-03-31 23:59:59'
ORDER BY fecha_hora;

-- DATE() para filtrar un día completo. En producción, el filtro por rango
-- de sp_calcular_ventas_diarias permite aprovechar el índice de fecha.
SELECT id_pedido, fecha_hora, total
FROM pedidos
WHERE DATE(fecha_hora) = '2026-01-12';

-- Ejemplos de procedimientos:
CALL sp_calcular_ventas_diarias('2026-01-12');
CALL sp_reporte_clientes_q1();
-- CALL sp_registrar_cliente_seguro('Nuevo Cliente', 'nuevo@example.test',
--   'hash_generado_por_la_aplicacion', '5550001099');
