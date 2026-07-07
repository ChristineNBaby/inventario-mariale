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
hay que crear la app en el **Dev Dashboard**. El proyecto ya trae lista la función de
servidor que se encarga de hablar con Shopify de forma segura (carpeta `/api`), sin
ningún paso extra de autorización en el navegador.

**1. Crea la app en el Dev Dashboard:**
1. Ve a [dev.shopify.com/dashboard](https://dev.shopify.com/dashboard)
2. Crea una app nueva (ej: "App Inventario Clínica")
3. En la versión de la app, agrega los scopes `read_inventory` y `write_inventory`, y publica una versión
4. Instala la app en tu tienda
5. En Settings, copia el **Client ID** y el **Client secret**

**2. En Vercel, agrega estas variables (Settings → Environment Variables):**
   - `SHOPIFY_STORE_DOMAIN` = `drmarialerivers.myshopify.com`
   - `SHOPIFY_CLIENT_ID` = (el Client ID que copiaste)
   - `SHOPIFY_CLIENT_SECRET` = (el Client secret que copiaste)
   - Dale "Deploy" / "Redeploy" para que tome las variables nuevas — listo, no hace falta nada más.

Nota: si al probar una venta ves el error "shop_not_permitted", significa que la app y la
tienda no están en la misma organización de Shopify. En ese caso avísame y usamos el método
alternativo (autorización manual una sola vez).

## Paso 4 — Abre el enlace en tu celular/iPad

1. Vercel te da un enlace tipo `inventario-mariale.vercel.app` — ábrelo en Safari (iPad) o Chrome (Android)
2. Toca el botón de compartir/menú
3. Elige "Agregar a pantalla de inicio"
4. Listo — queda como un ícono más, se abre igual que una app

## Notas importantes

- Cada vez que quieras actualizar la app, solo subes los cambios a GitHub (`git push`) y Vercel la actualiza sola.
- El token de Shopify (`shpat_...`) es secreto — nunca lo compartas ni lo subas directo al código.
- Si varias personas en la clínica van a usar el mismo enlace, todas ven y modifican el mismo inventario en tiempo real.
