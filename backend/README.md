# Módulo 2: API RIVA BURGUERS

FastAPI síncrono con SQLAlchemy 2, Pydantic v2 y PyMySQL. Usa exactamente las tablas de `../database/01_schema.sql`; no crea ni migra tablas al iniciar.

## Ejecutar localmente

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Editar DATABASE_URL, ADMIN_API_KEY y coordenadas en .env.
uvicorn app.main:app --reload
```

Preparar antes la base MySQL con los scripts del Módulo 1. `GET /health` verifica la conexión; `/docs` muestra los contratos HTTP. `precio_base`, stock y total usan `Decimal`. La API agrega tarifa de envío al total de los pedidos nuevos; las cinco órdenes de muestra del Módulo 1 no tenían tarifa.

## Aiven y Koyeb

- Crear un servicio MySQL **8.4** y cargar los scripts de `database/`.
- En Koyeb seleccionar el directorio **`backend/`** como contexto de construcción y su `Dockerfile`. Exponer el puerto HTTP que Koyeb suministra en `PORT`.
- Configurar como secretos `DATABASE_URL`, `ADMIN_API_KEY` y `MYSQL_SSL_CA_PEM` (contenido completo del CA PEM de Aiven), o montar un archivo y definir `MYSQL_SSL_CA`. Definir `APP_ENV=production` y `DB_SSL_REQUIRED=true`; SSL valida certificado y nombre del servidor.
- Si la contraseña de MySQL contiene caracteres reservados (`@`, `:`, `/`, `#`, etc.), codificarlos en la URL con porcentaje antes de definir `DATABASE_URL`.
- Definir `CORS_ORIGINS` con el origen HTTPS exacto de Vercel. Definir las coordenadas **reales** de la cocina antes de aceptar pedidos: los valores del ejemplo apuntan a una ubicación de demostración.

## API

| Ruta | Uso |
| --- | --- |
| `GET /api/v1/productos` | Catálogo disponible; `?incluir_no_disponibles=true` muestra todos los de categorías activas. |
| `POST /api/v1/productos` | Alta de producto deshabilitado. |
| `PUT /api/v1/productos/{id}` | Edición y activación si la receta tiene insumos suficientes. |
| `PUT /api/v1/productos/{id}/receta` | Reemplaza la receta; deja el producto deshabilitado hasta revisión. |
| `GET /api/v1/ingredientes` | Inventario y alertas. |
| `PUT /api/v1/ingredientes/{id}` | Ajuste de stock; deshabilita productos si queda bajo el mínimo. |
| `POST /api/v1/pedidos/cotizar` | Cobertura de 5 km, tarifa y ETA. |
| `POST /api/v1/pedidos` | Pedido, descuento BOM, pago pendiente y ETA. |
| `GET /api/v1/pedidos/kds` | Cola dinámica de cocina con agrupación de plancha. |
| `PATCH /api/v1/pedidos/{id}/estado` | `PENDIENTE → EN_PREPARACION → LISTO`. |
| `POST /api/v1/recomendaciones` | Complementos por coocurrencia histórica. |
| `POST /api/v1/usuarios` | Registra un cliente con contraseña PBKDF2-SHA256. |
| `GET/PUT/DELETE /api/v1/usuarios` | CRUD administrativo de usuarios; `DELETE` respeta las claves foráneas. |

Las rutas administrativas y KDS requieren el encabezado `X-Admin-Key`. No se debe insertar esa clave en código JavaScript público; el módulo web debe obtenerla del operador o sustituirla por autenticación de usuarios. `POST /pedidos` usa el `id_usuario` de un cliente registrado; la identidad del cliente todavía no se autentica. Los pagos se registran como **PENDIENTE**: esta API no cobra tarjetas ni marca pagos aprobados.

La cola KDS recalcula prioridad al consultar, usa pesos `(1.0, 0.35, 3.0)` y agrupa por proteínas compartidas dentro de bandas de cinco puntos. Los tiempos base de preparación se estiman por categoría porque el esquema académico no incluye tiempos por producto. El ETA aplica la fórmula de carga activa entre estaciones, más tránsito a velocidad configurada y cinco minutos de empaque. Recomendaciones usa frecuencia de pares de productos en pedidos no cancelados.
