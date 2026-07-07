import crypto from "node:crypto";

// Paso 1 del OAuth: redirige a la pantalla de autorización de Shopify.
// Visita /api/shopify-auth-start una sola vez para generar el token de acceso.
export default function handler(req, res) {
  const shop = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;

  if (!shop || !clientId) {
    res.status(500).send("Faltan SHOPIFY_STORE_DOMAIN o SHOPIFY_CLIENT_ID en las variables de entorno de Vercel.");
    return;
  }

  const state = crypto.randomUUID();
  const redirectUri = `https://${req.headers.host}/api/shopify-auth-callback`;
  const scopes = "read_inventory,write_inventory";

  const authorizeUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  res.setHeader("Set-Cookie", `shopify_oauth_state=${state}; HttpOnly; Secure; Path=/; Max-Age=300; SameSite=Lax`);
  res.writeHead(302, { Location: authorizeUrl });
  res.end();
}
