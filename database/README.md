# Módulo 1: base de datos RIVA BURGUERS

Scripts para **MySQL 8.0.16 o posterior**, incluida la rama 8.4. El esquema usa InnoDB, `utf8mb4`, claves foráneas, restricciones `CHECK`, columna generada y funciones de ventana. Todas las tablas tienen clave primaria. Los datos personales, direcciones y proveedores del seed son ficticios; los correos `example.test` no reciben mensajes.

**Versión en Aiven (septiembre de 2026):** Aiven dejó de admitir la creación de servicios MySQL 8.0 el 30 de abril de 2026 y anuncia su fin de soporte el 31 de octubre de 2026. Para un servicio nuevo en Aiven, seleccionar **MySQL 8.4**; el proyecto sigue usando sintaxis compatible con MySQL 8.0 para el requisito académico. Referencia: [ciclo de vida oficial de Aiven](https://aiven.io/docs/products/mysql/reference/version-lifecycle).

## Ejecución

1. Crear una base de datos vacía en Aiven o MySQL local y seleccionarla en MySQL Workbench. En Aiven se puede usar una base creada desde la consola; los scripts no requieren `CREATE DATABASE` ni `SUPER`.
2. Ejecutar los archivos completos en este orden:

   1. `01_schema.sql`
   2. `02_routines_triggers.sql`
   3. `03_seed.sql`
   4. `04_queries.sql`

Los archivos 1 a 3 son para una **base vacía** y se ejecutan una sola vez. `04_queries.sql` es de solo lectura salvo las llamadas a los dos procedimientos de reporte. Para la instalación por CLI, pasar cada archivo al cliente `mysql` con la base seleccionada. En Workbench, abrir y ejecutar cada archivo como script; `DELIMITER` es una instrucción del cliente, no una sentencia SQL enviada por un driver.

## Decisiones de datos

- `proveedores` es una entidad adicional para la consulta de contactos con `UNION`.
- `recetas` tiene una fila única por producto e ingrediente. `cantidad_requerida` usa la unidad definida por cada ingrediente.
- `detalle_pedido.precio_unitario` guarda el precio cobrado en ese pedido, aunque cambie `productos.precio_base`; `subtotal` se calcula automáticamente. `pedidos.total` guarda el importe final de la transacción, que más adelante podrá incluir envío y descuentos.
- Las tablas base separan roles, usuarios, categorías, productos, ingredientes, recetas, pedidos, pagos, seguimiento y proveedores. Los nombres de roles y categorías dependen de sus propias claves, y las relaciones muchos a muchos están en tablas de detalle. Esas dependencias mantienen los datos operativos en **tercera forma normal**; los importes históricos y totales son instantáneas transaccionales explícitas.
- `trg_ingredientes_bi` y `trg_ingredientes_bu` validan stock y nombre. La restricción `UNIQUE` es la garantía final contra duplicados concurrentes. `trg_pedidos_ai` crea un seguimiento por cada pedido, incluidos los cinco del seed.
- `Papas Trufadas` comienza no disponible porque el aceite de trufa está por debajo del mínimo. Una venta pasada puede seguir conteniendo ese producto.
- `sp_reporte_clientes_q1()` consulta enero a marzo del **año actual del servidor**. El seed contiene pedidos de Q1 de 2026; después de ese año, usar datos del año vigente para ver actividad en ese reporte.

## Comprobación rápida

```sql
SELECT COUNT(*) AS seguimientos FROM seguimiento_clientes; -- 5
SELECT p.id_pedido, p.total, SUM(d.subtotal) AS suma_detalle
FROM pedidos p JOIN detalle_pedido d ON d.id_pedido = p.id_pedido
GROUP BY p.id_pedido, p.total;
CALL sp_calcular_ventas_diarias('2026-01-12'); -- 1 pedido, 287.00
```

Las cuentas del seed son exclusivamente de demostración. El hash PBKDF2-SHA256 incluido corresponde a `RivaDemo2026!`; reemplazar cuentas y credenciales antes de usar el sistema con clientes reales. La autenticación del backend deberá verificar ese formato o migrar los hashes al formato elegido.
