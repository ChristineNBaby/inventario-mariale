// Utilidades compartidas para hablar con Shopify desde las funciones del servidor.
// (Los archivos que empiezan con "_" no se convierten en rutas públicas en Vercel.)
// El Client ID/Secret nunca llegan al navegador. Usa el "client credentials grant":
// pide un token nuevo cuando lo necesita (dura 24h) y lo guarda en memoria.

const API_VERSION = "2024-10";

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function limpiarDominio(shop) {
  return shop
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

export async function parseJsonOrThrow(response, etiqueta) {
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

// Lee las variables de entorno. Devuelve null si Shopify no está configurado.
export function leerConfig() {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const dominio = process.env.SHOPIFY_STORE_DOMAIN;
  if (!dominio || !clientId || !clientSecret) return null;
  return { shop: limpiarDominio(dominio), clientId, clientSecret };
}

// Ejecuta una operación GraphQL contra el Admin API y devuelve `data`.
// Lanza un error si Shopify responde con errores de nivel superior.
export async function shopifyGraphql(config, query, variables) {
  const token = await getAccessToken(config.shop, config.clientId, config.clientSecret);
  const response = await fetch(`https://${config.shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await parseJsonOrThrow(response, "graphql");
  if (data.errors) {
    throw new Error("Error de Shopify: " + JSON.stringify(data.errors));
  }
  return data.data;
}
