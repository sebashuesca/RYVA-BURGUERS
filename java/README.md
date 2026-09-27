# Módulo 3: evidencia Java JDBC

`ConexionRivaBurguers.java` usa `DriverManager`, `PreparedStatement`, transacción y `sslMode=VERIFY_IDENTITY` contra Aiven MySQL 8.4. Crea un producto temporal deshabilitado, lo consulta, actualiza, vuelve a consultar y elimina; al finalizar no queda una fila de prueba. Si falla un paso, revierte la transacción.

## Preparar y ejecutar

Requiere JDK 17+, Maven y una base con el Módulo 1 cargado. Descargar el certificado CA del proyecto Aiven y crear un truststore local:

```bash
keytool -importcert -alias aiven-mysql -file ca.pem \
  -keystore aiven-truststore.p12 -storetype PKCS12
```

Definir las variables `RIVA_DB_HOST`, `RIVA_DB_PORT`, `RIVA_DB_NAME`, `RIVA_DB_USER`, `RIVA_DB_PASSWORD`, `RIVA_DB_TRUSTSTORE_PATH` (ruta absoluta) y `RIVA_DB_TRUSTSTORE_PASSWORD`. Luego:

```bash
cd java
mvn -q compile exec:java -Dexec.mainClass=ConexionRivaBurguers
```

La salida muestra versión del servidor y los pasos `CREATE`, `READ`, `UPDATE` y `DELETE` con el mismo ID. No guardar contraseñas, truststore ni capturas con secretos en el repositorio. La conexión exige certificado y coincidencia del nombre de host según [Connector/J](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-using-ssl.html).
