// Trae todos los productos reales de Shopify (con precio, foto y stock en la
// ubicación "Clínica") para mostrarlos en la app. Corre en el servidor — mismas
// credenciales que /api/set-inventory.
const SHOPIFY_LOCATION_ID = "gid://shopify/Location/79362425046"; // Clínica

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function limpiarDominio(shop) {
  return shop
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

async function parseJsonOrThrow(response, etiqueta) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${etiqueta}: HTTP ${response.status} desde ${response.url} — respuesta no es JSON: ${text.slice(0, 200)}`);
  }
}

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
  const data = await parseJsonOrThrow(response, "token");
  if (!data.access_token) {
    const detalle = data.error_description || data.error || `HTTP ${response.status}`;
    throw new Error(`No se pudo obtener un token de Shopify (${detalle}).`);
  }
  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!process.env.SHOPIFY_STORE_DOMAIN || !clientId || !clientSecret) {
    res.status(500).json({ ok: false, error: "Shopify no está configurado todavía (faltan variables de entorno en el servidor)." });
    return;
  }

  const shop = limpiarDominio(process.env.SHOPIFY_STORE_DOMAIN);

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
          query {
            products(first: 250, sortKey: TITLE) {
              edges {
                node {
                  id
                  title
                  featuredImage { url }
                  variants(first: 1) {
                    edges {
                      node {
                        id
                        price
                        inventoryItem {
                          inventoryLevel(locationId: "${SHOPIFY_LOCATION_ID}") {
                            quantities(names: ["available"]) { quantity }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
      }),
    });
    const data = await parseJsonOrThrow(response, "productos");
    if (data.errors) {
      res.status(200).json({ ok: false, error: "Error de Shopify: " + JSON.stringify(data.errors) });
      return;
    }

    const productos = (data?.data?.products?.edges || []).map(({ node }, i) => {
      const variant = node.variants.edges[0]?.node;
      const cantidad = variant?.inventoryItem?.inventoryLevel?.quantities?.[0]?.quantity ?? 0;
      return {
        id: i + 1,
        shopifyProductId: node.id,
        shopifyVariantId: variant?.id || null,
        nombre: node.title,
        tipo: "producto",
        precio: Math.round(parseFloat(variant?.price || "0")),
        metodoPago: "Efectivo",
        stock: cantidad,
        foto: node.featuredImage?.url || null,
      };
    });

    res.status(200).json({ ok: true, productos });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message || "No se pudo conectar con Shopify." });
  }
}
