-- Ejecutar después de 01_schema.sql y antes de 03_seed.sql.
-- Workbench y cliente mysql entienden DELIMITER; no enviar este archivo como
-- una sola cadena SQL a través de un driver.
SET NAMES utf8mb4;
DELIMITER $$

CREATE PROCEDURE sp_calcular_ventas_diarias(IN fecha_consulta DATE)
READS SQL DATA
BEGIN
  IF fecha_consulta IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'fecha_consulta es obligatoria';
  END IF;

  SELECT fecha_consulta AS fecha,
         COUNT(*) AS pedidos_entregados,
         COALESCE(SUM(p.total), 0.00) AS ventas_totales,
         COALESCE(ROUND(AVG(p.total), 2), 0.00) AS ticket_promedio
  FROM pedidos p
  WHERE p.fecha_hora >= fecha_consulta
    AND p.fecha_hora < fecha_consulta + INTERVAL 1 DAY
    AND p.estado_pedido = 'ENTREGADO';
END$$

CREATE PROCEDURE sp_reporte_clientes_q1()
READS SQL DATA
BEGIN
  -- Q1 del año actual según la fecha del servidor; excluye cancelaciones.
  SELECT u.id_usuario, u.nombre, u.email,
         COUNT(DISTINCT p.id_pedido) AS numero_pedidos,
         COALESCE(SUM(p.total), 0.00) AS gasto_total,
         MAX(p.fecha_hora) AS ultima_compra
  FROM usuarios u
  JOIN roles r ON r.id_rol = u.id_rol
  LEFT JOIN pedidos p ON p.id_usuario = u.id_usuario
    AND p.fecha_hora >= MAKEDATE(YEAR(CURDATE()), 1)
    AND p.fecha_hora < MAKEDATE(YEAR(CURDATE()), 1) + INTERVAL 3 MONTH
    AND p.estado_pedido <> 'CANCELADO'
  WHERE r.nombre_rol = 'CLIENTE'
  GROUP BY u.id_usuario, u.nombre, u.email
  ORDER BY gasto_total DESC, u.id_usuario;
END$$

CREATE PROCEDURE sp_registrar_cliente_seguro(
  IN p_nombre VARCHAR(120),
  IN p_email VARCHAR(254),
  IN p_password_hash VARCHAR(255),
  IN p_telefono VARCHAR(25)
)
MODIFIES SQL DATA
BEGIN
  DECLARE v_id_rol SMALLINT UNSIGNED DEFAULT NULL;
  DECLARE EXIT HANDLER FOR 1062
  BEGIN
    SELECT 'EMAIL_DUPLICADO' AS resultado, NULL AS id_usuario,
           'El correo ya está registrado' AS mensaje;
  END;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION RESIGNAL;

  IF p_nombre IS NULL OR TRIM(p_nombre) = ''
     OR p_email IS NULL OR TRIM(p_email) = ''
     OR p_password_hash IS NULL OR TRIM(p_password_hash) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nombre, correo y hash son obligatorios';
  END IF;

  SELECT id_rol INTO v_id_rol FROM roles WHERE nombre_rol = 'CLIENTE';
  IF v_id_rol IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No existe el rol CLIENTE';
  END IF;

  INSERT INTO usuarios (id_rol, nombre, email, password_hash, telefono)
  VALUES (v_id_rol, TRIM(p_nombre), TRIM(p_email), p_password_hash, p_telefono);
  SELECT 'CREADO' AS resultado, LAST_INSERT_ID() AS id_usuario,
         'Cliente registrado' AS mensaje;
END$$

CREATE TRIGGER trg_ingredientes_bi
BEFORE INSERT ON ingredientes
FOR EACH ROW
BEGIN
  IF NEW.stock_actual < 0 OR NEW.stock_minimo < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El stock no puede ser negativo';
  END IF;
  IF EXISTS (SELECT 1 FROM ingredientes i
             WHERE i.nombre_insumo = NEW.nombre_insumo) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ingrediente duplicado';
  END IF;
END$$

CREATE TRIGGER trg_ingredientes_bu
BEFORE UPDATE ON ingredientes
FOR EACH ROW
BEGIN
  IF NEW.stock_actual < 0 OR NEW.stock_minimo < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El stock no puede ser negativo';
  END IF;
  IF EXISTS (SELECT 1 FROM ingredientes i
             WHERE i.nombre_insumo = NEW.nombre_insumo
               AND i.id_ingrediente <> OLD.id_ingrediente) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ingrediente duplicado';
  END IF;
END$$

CREATE TRIGGER trg_pedidos_ai
AFTER INSERT ON pedidos
FOR EACH ROW
BEGIN
  INSERT INTO seguimiento_clientes
    (id_usuario, id_pedido, fecha_registro, mensaje)
  VALUES
    (NEW.id_usuario, NEW.id_pedido, NEW.fecha_hora, 'Pedido recibido');
END$$

DELIMITER ;
