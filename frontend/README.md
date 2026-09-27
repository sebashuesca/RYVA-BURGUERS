# Módulo 4: web de clientes y cocina RIVA

App React con Vite. El menú, carrito, sugerencias y checkout consumen la API del Módulo 2. La vista de cocina usa `#/kds` y muestra tres columnas con comandas ordenadas por prioridad; se actualiza cada ocho segundos. Electron abre esa vista en una ventana de escritorio.

El panel de productos está en `#/admin`, accesible también desde el icono de productos del KDS. Usa la misma clave administrativa de sesión. Permite crear, editar y eliminar productos, editar su receta y controlar la disponibilidad. La imagen predeterminada se elige según la categoría cuando se deja vacío el enlace; el servidor aplica la misma regla. Los productos que ya aparecen en pedidos no se borran físicamente: el panel muestra el conflicto y permite ocultarlos desactivando **Disponible en el menú**. La categoría Postres se ofrece cuando exista en la tabla `categorias`.

## Ejecutar localmente

1. Cargar los scripts de `database/` y arrancar la API como indica `backend/README.md`.
2. En `frontend/`, copiar `.env.example` a `.env.local` y ajustar `VITE_API_BASE_URL` a la URL de la API. Usar las mismas coordenadas de cocina que en el backend.
3. Ejecutar `npm ci` y `npm run dev`.
4. Abrir `http://localhost:5173/` para clientes, `http://localhost:5173/#/kds` para cocina o `http://localhost:5173/#/admin` para productos.

El KDS pide la clave `ADMIN_API_KEY` al operador y la conserva solo en `sessionStorage` durante esa sesión. El checkout registra o recupera un cliente, consulta `/api/v1/pedidos/cotizar` y confirma un pedido con pago en efectivo pendiente. La distancia Haversine mostrada en pantalla es orientativa; la cobertura, tarifa y ETA definitivos provienen de la API. La geolocalización requiere permiso del usuario y un contexto seguro (`localhost` o HTTPS). También se pueden escribir las coordenadas manualmente.

## Vercel

Crear el proyecto con directorio raíz **`frontend/`**. `vercel.json` ejecuta `npm run build` y publica `dist/`. Definir antes del build:

```text
VITE_API_BASE_URL=https://tu-api.koyeb.app
VITE_KITCHEN_LATITUDE=19.4326
VITE_KITCHEN_LONGITUDE=-99.1332
```

Las coordenadas de arriba son solo un ejemplo: establecer las reales en Vercel y Koyeb. En Koyeb, agregar el dominio HTTPS exacto del frontend a `CORS_ORIGINS`. Las variables `VITE_` son públicas en el bundle; no colocar claves ni credenciales en ellas. Para usar el KDS web, el operador introduce la clave al abrirlo. Vercel no sirve como proxy de la API.

## Electron

Desde `frontend/`, ejecutar `npm run electron:dev` para desarrollo. `npm run electron:dir` genera un directorio ejecutable local y `npm run electron:pack` genera un AppImage Linux. La compilación incorpora `VITE_API_BASE_URL`; para producción debe ser una URL **HTTPS** accesible desde la computadora de cocina. Agregar `riva://app` a `CORS_ORIGINS` de Koyeb, además del origen de Vercel. Electron sirve los archivos compilados con el protocolo seguro `riva://app`, abre `#/kds` y mantiene Node desactivado en la página.

La API actual usa `X-Admin-Key` para el KDS. El login de cliente recupera su ID, pero el endpoint de pedidos todavía no autentica la identidad del cliente; antes de operar con cuentas reales se requiere autenticación del lado del servidor. El pago se registra como pendiente y no procesa tarjetas.
