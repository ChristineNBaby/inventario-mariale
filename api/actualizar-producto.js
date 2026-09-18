// Actualiza el NOMBRE y/o PRECIO de un producto que YA EXISTE en Shopify. El
// STOCK se corrige aparte con /api/ajustar-stock (que ya sabe manejar las dos
// ubicaciones con un delta). Este endpoint solo toca lo que realmente cambió.
import { leerConfig, shopifyGraphql } from "./_shopify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const config = leerConfig();
  if (!config) {
    res.status(500).json({ ok: false, error: "Shopify no está configurado todavía (faltan variables de entorno en el servidor)." });
    return;
  }

  const { shopifyProductId, shopifyVariantId, nombre, precio } = req.body || {};
  if (!shopifyProductId) {
    res.status(400).json({ ok: false, error: "Falta shopifyProductId." });
    return;
  }

  try {
    if (nombre) {
      const data = await shopifyGraphql(
        config,
        `mutation($input: ProductInput!) {
          productUpdate(input: $input) { userErrors { field message } }
        }`,
        { input: { id: shopifyProductId, title: nombre } }
      );
      const errors = data?.productUpdate?.userErrors;
      if (errors && errors.length > 0) {
        res.status(200).json({ ok: false, error: errors.map((e) => e.message).join(", ") });
        return;
      }
    }

    if (precio != null && shopifyVariantId) {
      const data = await shopifyGraphql(
        config,
        `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }`,
        { productId: shopifyProductId, variants: [{ id: shopifyVariantId, price: String(precio) }] }
      );
      const errors = data?.productVariantsBulkUpdate?.userErrors;
      if (errors && errors.length > 0) {
        res.status(200).json({ ok: false, error: errors.map((e) => e.message).join(", ") });
        return;
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message || "No se pudo conectar con Shopify." });
  }
}
