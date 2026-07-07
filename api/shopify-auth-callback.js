import crypto from "node:crypto";

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .filter(Boolean)
      .map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
  );
}

function htmlPage(body) {
  return `<html><body style="font-family: sans-serif; padding: 2rem; max-width: 640px; margin: 0 auto;">${body}</body></html>`;
}

// Paso 2 del OAuth: Shopify redirige aquí después de que autorizas la app.
// Intercambia el código por un token de acceso y lo muestra una sola vez para copiarlo a Vercel.
export default async function handler(req, res) {
  const { shop, code, state, hmac } = req.query;
  const cookies = parseCookies(req.headers.cookie || "");

  if (!state || state !== cookies.shopify_oauth_state) {
    res.status(400).send(htmlPage("<h2>Estado inválido</h2><p>Vuelve a intentarlo desde /api/shopify-auth-start.</p>"));
    return;
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  const params = { ...req.query };
  delete params.hmac;
  delete params.signature;
  const message = Object.keys(params)
    .sort()
    .map((k) => `${k}=${Array.isArray(params[k]) ? params[k].join(",") : params[k]}`)
    .join("&");
  const generatedHmac = crypto.createHmac("sha256", clientSecret).update(message).digest("hex");
  const hmacBuf = Buffer.from(hmac || "", "hex");
  const generatedBuf = Buffer.from(generatedHmac, "hex");
  const validHmac = hmacBuf.length === generatedBuf.length && crypto.timingSafeEqual(hmacBuf, generatedBuf);

  if (!validHmac) {
    res.status(400).send(htmlPage("<h2>Firma inválida</h2><p>La solicitud no pudo verificarse.</p>"));
    return;
  }

  const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const data = await tokenResponse.json();

  if (!data.access_token) {
    res.status(500).send(htmlPage(`<h2>No se pudo obtener el token</h2><pre>${JSON.stringify(data, null, 2)}</pre>`));
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(
    htmlPage(`
      <h2>Token generado correctamente</h2>
      <p>Copia este valor y pégalo en Vercel como la variable <code>SHOPIFY_ACCESS_TOKEN</code>, luego vuelve a hacer Deploy:</p>
      <textarea style="width:100%;height:80px;" readonly onclick="this.select()">${data.access_token}</textarea>
      <p style="color:#a00;">Cierra esta pestaña después de copiarlo — no la compartas con nadie.</p>
    `)
  );
}
