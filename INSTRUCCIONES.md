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

Desde 2026, Shopify ya no entrega un token fijo directamente en su panel para apps nuevas —
hay que crear la app en el **Dev Dashboard** y autorizarla una vez. El proyecto ya trae
listas las funciones de servidor que hacen esto de forma segura (carpeta `/api`).

**1. Crea la app en el Dev Dashboard:**
1. Ve a [dev.shopify.com/dashboard](https://dev.shopify.com/dashboard)
2. Crea una app nueva (ej: "App Inventario Clínica")
3. En la versión de la app, agrega los scopes `read_inventory` y `write_inventory`, y publica una versión
4. En Settings, copia el **Client ID** y el **Client secret**

**2. En Vercel, agrega estas variables (Settings → Environment Variables):**
   - `SHOPIFY_STORE_DOMAIN` = `drmarialerivers.myshopify.com`
   - `SHOPIFY_CLIENT_ID` = (el Client ID que copiaste)
   - `SHOPIFY_CLIENT_SECRET` = (el Client secret que copiaste)
   - Dale "Deploy" / "Redeploy" para que tome las variables nuevas

**3. Autoriza la app una sola vez:**
1. Visita `https://tu-proyecto.vercel.app/api/shopify-auth-start`
2. Inicia sesión y aprueba el acceso en la pantalla de Shopify
3. Te va a mostrar una página con el token — cópialo
4. Vuelve a Vercel y agrega una variable más: `SHOPIFY_ACCESS_TOKEN` = (el token que copiaste)
5. Dale "Redeploy" una última vez

## Paso 4 — Abre el enlace en tu celular/iPad

1. Vercel te da un enlace tipo `inventario-mariale.vercel.app` — ábrelo en Safari (iPad) o Chrome (Android)
2. Toca el botón de compartir/menú
3. Elige "Agregar a pantalla de inicio"
4. Listo — queda como un ícono más, se abre igual que una app

## Notas importantes

- Cada vez que quieras actualizar la app, solo subes los cambios a GitHub (`git push`) y Vercel la actualiza sola.
- El token de Shopify (`shpat_...`) es secreto — nunca lo compartas ni lo subas directo al código.
- Si varias personas en la clínica van a usar el mismo enlace, todas ven y modifican el mismo inventario en tiempo real.
