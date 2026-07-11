// Reenvía cada venta (o cancelación) a un registro externo SEGURO y permanente:
// una hoja de Google Sheets, a través de un webhook de Google Apps Script.
//
// La URL del webhook vive SOLO en el servidor (variable de entorno
// REGISTRO_WEBHOOK_URL), nunca en el navegador — así nadie puede escribir en la
// hoja desde afuera. El navegador solo habla con este endpoint.
//
// Si el registro todavía no está configurado, respondemos ok:false sin romper
// nada: la venta igual se guarda en el teléfono.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const url = process.env.REGISTRO_WEBHOOK_URL;
  if (!url) {
    res.status(200).json({ ok: false, error: "El registro de ventas todavía no está configurado (falta REGISTRO_WEBHOOK_URL en el servidor)." });
    return;
  }

  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {}),
    });
    const texto = await respuesta.text();
    res.status(200).json({ ok: respuesta.ok, detalle: texto.slice(0, 200) });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message || "No se pudo conectar con el registro." });
  }
}
