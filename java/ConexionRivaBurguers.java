import java.math.BigDecimal;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;
import java.util.UUID;

/**
 * Evidencia JDBC: conexión TLS a Aiven MySQL y CRUD parametrizado en PRODUCTOS.
 * El registro de prueba se elimina al final de la misma transacción.
 */
public final class ConexionRivaBurguers {
    private ConexionRivaBurguers() { }

    private static String variable(String nombre) {
        String valor = System.getenv(nombre);
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("Falta la variable " + nombre);
        }
        return valor;
    }

    private static Connection conectar() throws Exception {
        String host = variable("RIVA_DB_HOST");
        int puerto = Integer.parseInt(variable("RIVA_DB_PORT"));
        String base = variable("RIVA_DB_NAME");
        String usuario = variable("RIVA_DB_USER");
        String contrasena = variable("RIVA_DB_PASSWORD");
        String truststore = variable("RIVA_DB_TRUSTSTORE_PATH");
        String claveTruststore = variable("RIVA_DB_TRUSTSTORE_PASSWORD");

        // Los secretos van en Properties, no en la URL ni en la salida.
        Properties propiedades = new Properties();
        propiedades.setProperty("user", usuario);
        propiedades.setProperty("password", contrasena);
        propiedades.setProperty("sslMode", "VERIFY_IDENTITY");
        propiedades.setProperty("trustCertificateKeyStoreUrl", Paths.get(truststore).toUri().toString());
        propiedades.setProperty("trustCertificateKeyStoreType", "PKCS12");
        propiedades.setProperty("trustCertificateKeyStorePassword", claveTruststore);
        propiedades.setProperty("connectTimeout", "10000");
        propiedades.setProperty("socketTimeout", "15000");

        Class.forName("com.mysql.cj.jdbc.Driver");
        String url = "jdbc:mysql://" + host + ":" + puerto + "/" + base;
        return DriverManager.getConnection(url, propiedades);
    }

    private static int primeraCategoriaActiva(Connection conexion) throws SQLException {
        String sql = "SELECT id_categoria FROM categorias WHERE activo = TRUE ORDER BY id_categoria LIMIT 1";
        try (PreparedStatement ps = conexion.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (!rs.next()) {
                throw new SQLException("No existe una categoría activa para la prueba");
            }
            return rs.getInt("id_categoria");
        }
    }

    private static long crearProducto(Connection conexion, int categoria, String nombre)
            throws SQLException {
        String sql = "INSERT INTO productos "
                + "(id_categoria, nombre, descripcion, precio_base, imagen_url, disponible) "
                + "VALUES (?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conexion.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, categoria);
            ps.setString(2, nombre);
            ps.setString(3, "Registro temporal de evidencia JDBC");
            ps.setBigDecimal(4, new BigDecimal("99.00"));
            ps.setNull(5, java.sql.Types.VARCHAR);
            ps.setBoolean(6, false); // Sin receta, no se publica en el menú.
            if (ps.executeUpdate() != 1) {
                throw new SQLException("No se insertó el producto");
            }
            try (ResultSet claves = ps.getGeneratedKeys()) {
                if (!claves.next()) {
                    throw new SQLException("No se recibió el ID generado");
                }
                return claves.getLong(1);
            }
        }
    }

    private static void leerProducto(Connection conexion, long id) throws SQLException {
        String sql = "SELECT id_producto, nombre, precio_base, disponible "
                + "FROM productos WHERE id_producto = ?";
        try (PreparedStatement ps = conexion.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    throw new SQLException("Producto no encontrado: " + id);
                }
                System.out.printf("READ  id=%d nombre=%s precio=%s disponible=%s%n",
                        rs.getLong("id_producto"), rs.getString("nombre"),
                        rs.getBigDecimal("precio_base"), rs.getBoolean("disponible"));
            }
        }
    }

    private static void actualizarProducto(Connection conexion, long id) throws SQLException {
        String sql = "UPDATE productos SET descripcion = ?, precio_base = ? WHERE id_producto = ?";
        try (PreparedStatement ps = conexion.prepareStatement(sql)) {
            ps.setString(1, "Actualizado mediante PreparedStatement");
            ps.setBigDecimal(2, new BigDecimal("109.00"));
            ps.setLong(3, id);
            if (ps.executeUpdate() != 1) {
                throw new SQLException("No se actualizó el producto " + id);
            }
        }
    }

    private static void eliminarProducto(Connection conexion, long id) throws SQLException {
        String sql = "DELETE FROM productos WHERE id_producto = ?";
        try (PreparedStatement ps = conexion.prepareStatement(sql)) {
            ps.setLong(1, id);
            if (ps.executeUpdate() != 1) {
                throw new SQLException("No se eliminó el producto " + id);
            }
        }
    }

    public static void main(String[] args) throws Exception {
        try (Connection conexion = conectar()) {
            System.out.println("Conectado a " + conexion.getMetaData().getDatabaseProductName()
                    + " " + conexion.getMetaData().getDatabaseProductVersion());
            conexion.setAutoCommit(false);
            try {
                int categoria = primeraCategoriaActiva(conexion);
                String nombre = "Prueba JDBC " + UUID.randomUUID();
                long id = crearProducto(conexion, categoria, nombre);
                System.out.println("CREATE id=" + id);
                leerProducto(conexion, id);
                actualizarProducto(conexion, id);
                System.out.println("UPDATE id=" + id);
                leerProducto(conexion, id);
                eliminarProducto(conexion, id);
                System.out.println("DELETE id=" + id);
                conexion.commit();
                System.out.println("CRUD completado; producto temporal eliminado.");
            } catch (SQLException error) {
                conexion.rollback();
                System.err.printf("SQLState=%s código=%d mensaje=%s%n",
                        error.getSQLState(), error.getErrorCode(), error.getMessage());
                throw error;
            }
        }
    }
}
