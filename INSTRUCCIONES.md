# Cómo subir tu app a tu celular/iPad

## Paso 1 — Sube este proyecto a GitHub

1. Ve a [github.com/new](https://github.com/new) y crea un repositorio nuevo (puede ser privado).
   Nómbralo, por ejemplo: `inventario-mariale`
2. En tu computadora, dentro de esta carpeta, corre:
   ```
   git init
   git add .
   git commit -m "Primera versión del inventario"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/inventario-mariale.git
   git push -u origin main
   ```
   (Reemplaza `TU-USUARIO` por tu usuario de GitHub)

## Paso 2 — Conecta con Vercel

1. Entra a [vercel.com/new](https://vercel.com/new)
2. Elige "Import Git Repository" y selecciona el repositorio `inventario-mariale`
3. Vercel detecta automáticamente que es un proyecto Vite — no cambies nada, solo dale "Deploy"

## Paso 3 — Agrega tus llaves secretas de Shopify

**Antes de esto, necesitas generar un Admin API access token:**
1. En tu panel de Shopify: Configuración → Apps y canales de venta → Desarrollar apps
2. Crea una app nueva (ej: "App Inventario Clínica")
3. En "Configuración de API", dale permiso de **lectura y escritura de Inventario** (`read_inventory`, `write_inventory`)
4. Instala la app y copia el "Admin API access token" (empieza con `shpat_...`) — solo se muestra una vez, guárdalo bien

**Ya con el token en mano, en Vercel:**
1. Ve a tu proyecto → Settings → Environment Variables
2. Agrega estas dos:
   - `VITE_SHOPIFY_STORE_DOMAIN` = `drmarialerivers.myshopify.com`
   - `VITE_SHOPIFY_ACCESS_TOKEN` = (el token que copiaste, empieza con shpat_)
3. Dale "Redeploy" al proyecto para que tome las variables nuevas

## Paso 4 — Abre el enlace en tu celular/iPad

1. Vercel te da un enlace tipo `inventario-mariale.vercel.app` — ábrelo en Safari (iPad) o Chrome (Android)
2. Toca el botón de compartir/menú
3. Elige "Agregar a pantalla de inicio"
4. Listo — queda como un ícono más, se abre igual que una app

## Notas importantes

- Cada vez que quieras actualizar la app, solo subes los cambios a GitHub (`git push`) y Vercel la actualiza sola.
- El token de Shopify (`shpat_...`) es secreto — nunca lo compartas ni lo subas directo al código.
- Si varias personas en la clínica van a usar el mismo enlace, todas ven y modifican el mismo inventario en tiempo real.
