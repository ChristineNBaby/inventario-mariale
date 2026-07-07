// Descuenta stock en Shopify. Corre en el servidor de Vercel — el token de acceso
// nunca llega al navegador, a diferencia del diseño anterior con VITE_SHOPIFY_ACCESS_TOKEN.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const shop = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shop || !token) {
    res.status(500).json({ ok: false, error: "Shopify no está configurado todavía (faltan variables de entorno en el servidor)." });
    return;
  }

  const { inventoryItemId, locationId, quantity } = req.body || {};
  if (!inventoryItemId || !locationId || quantity == null) {
    res.status(400).json({ ok: false, error: "Faltan datos: inventoryItemId, locationId o quantity." });
    return;
  }

  try {
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
    res.status(200).json({ ok: false, error: "No se pudo conectar con Shopify." });
  }
}
