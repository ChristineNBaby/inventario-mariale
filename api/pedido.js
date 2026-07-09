// Guarda o quita el estado de pedido de un producto. El estado vive en un
// metafield del producto EN SHOPIFY (namespace "inventario", key "pedido"),
// así todas las personas del equipo ven la misma lista desde cualquier
// celular/iPad, y también queda visible en el admin de Shopify.
//   - accion "por_pedir": alguien lo marcó a mano como pendiente de pedir
//   - accion "pedido":    ya se ordenó al proveedor (con la cantidad pedida)
//   - accion "quitar":    sacarlo de la lista
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

  const { productId, accion, cantidad } = req.body || {};
  if (!productId || !["por_pedir", "pedido", "quitar"].includes(accion)) {
    res.status(400).json({ ok: false, error: "Faltan datos: productId y accion (por_pedir, pedido o quitar)." });
    return;
  }

  try {
    if (accion === "quitar") {
      const data = await shopifyGraphql(
        config,
        `mutation($metafields: [MetafieldIdentifierInput!]!) {
          metafieldsDelete(metafields: $metafields) { userErrors { field message } }
        }`,
        { metafields: [{ ownerId: productId, namespace: "inventario", key: "pedido" }] }
      );
      const errors = data?.metafieldsDelete?.userErrors;
      if (errors && errors.length > 0) {
        res.status(200).json({ ok: false, error: errors.map((e) => e.message).join(", ") });
        return;
      }
    } else {
      const valor = {
        estado: accion,
        cantidad: accion === "pedido" ? Number(cantidad) || null : null,
        fecha: new Date().toISOString(),
      };
      const data = await shopifyGraphql(
        config,
        `mutation($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id }
            userErrors { field message }
          }
        }`,
        {
          metafields: [{
            ownerId: productId,
            namespace: "inventario",
            key: "pedido",
            type: "json",
            value: JSON.stringify(valor),
          }],
        }
      );
      const errors = data?.metafieldsSet?.userErrors;
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
