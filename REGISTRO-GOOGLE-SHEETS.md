# Conectar las ventas a una hoja de Google Sheets (registro seguro)

Cada venta y cancelación de la app se envía a una hoja de Google Sheets en tu
propio Google Drive, que se va llenando sola. Así queda un registro permanente,
seguro y compartido (como un Excel en la nube).

## Paso 1 — Crear la hoja
1. Entra a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva.
2. Nómbrala, por ejemplo: **Registro de Ventas - Clínica**.

## Paso 2 — Pegar el script
1. En la hoja: menú **Extensiones → Apps Script**.
2. Borra lo que haya y pega este código:

```javascript
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Ventas") || ss.insertSheet("Ventas");
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(["Fecha","Acción","Producto/Servicio","Cantidad",
      "Precio unit.","Total","Método de pago","Atendido por","Canal","Tipo"]);
  }
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) {}
  var fecha = d.fecha ? new Date(d.fecha) : new Date();
  hoja.appendRow([
    fecha, d.accion || "venta", d.nombre || "", d.cantidad || "",
    d.precio || "", d.total || "", d.metodoPago || "", d.vendedor || "",
    d.canal || "", d.tipo || ""
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Guarda (ícono del disquete).

## Paso 3 — Publicar como aplicación web
1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web** (Web app).
3. Configura:
   - **Ejecutar como:** Yo (tu correo)
   - **Quién tiene acceso:** Cualquier persona
4. **Implementar**. Google pedirá autorizar — acepta con tu cuenta.
5. Copia la **URL de la aplicación web** (empieza con `https://script.google.com/macros/s/...`).

## Paso 4 — Conectar con la app
Envíale esa URL a Claude. Él la pone en el servidor (`/api/registro`) y vuelve a
desplegar — la URL queda solo en el servidor, nunca en el navegador. Listo:
desde ese momento cada venta aparece como una fila nueva en tu hoja.

(Alternativa manual: en Vercel → proyecto inventario-mariale → Settings →
Environment Variables → agregar `REGISTRO_WEBHOOK_URL` = esa URL → Redeploy.)
