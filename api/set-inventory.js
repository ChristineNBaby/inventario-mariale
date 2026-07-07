// Descuenta stock en Shopify. Corre en el servidor de Vercel — el Client ID/Secret
// nunca llegan al navegador. Usa el "client credentials grant": en vez de guardar un
// token fijo, este código le pide a Shopify uno nuevo cuando lo necesita (dura 24h),
// así no hace falta ningún paso manual de autorización en el navegador.
let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken(shop, clientId, clientSecret) {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken;
  }
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const data = await response.json();
  if (!data.access_token) {
    throw new Error(data.error_description || "No se pudo obtener un token de Shopify.");
  }
  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const shop = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!shop || !clientId || !clientSecret) {
    res.status(500).json({ ok: false, error: "Shopify no está configurado todavía (faltan variables de entorno en el servidor)." });
    return;
  }

  const { inventoryItemId, locationId, quantity } = req.body || {};
  if (!inventoryItemId || !locationId || quantity == null) {
    res.status(400).json({ ok: false, error: "Faltan datos: inventoryItemId, locationId o quantity." });
    return;
  }

  try {
    const token = await getAccessToken(shop, clientId, clientSecret);
    const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        query: `
          mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
            inventorySetQuantities(input: $input) {
              userErrors { field message }
            }
          }
        `,
        variables: {
          input: {
            reason: "correction",
            name: "available",
            quantities: [{ inventoryItemId, locationId, quantity }],
          },
        },
      }),
    });
    const data = await response.json();
    const errors = data?.data?.inventorySetQuantities?.userErrors;
    if (errors && errors.length > 0) {
      res.status(200).json({ ok: false, error: errors.map((e) => e.message).join(", ") });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message || "No se pudo conectar con Shopify." });
  }
}
