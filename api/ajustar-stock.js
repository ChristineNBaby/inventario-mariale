// Ajusta el stock en Shopify SUMANDO o RESTANDO una cantidad (delta), en vez de
// sobreescribir el total. Así, si dos personas mueven inventario al mismo tiempo,
// Shopify hace la suma correcta y nadie pisa el cambio del otro.
//   - Una venta manda delta negativo (motivo "venta").
//   - Una recepción de pedido manda delta positivo (motivo "recibido") y además
//     quita el producto de la lista de pedidos pendientes.
import { leerConfig, shopifyGraphql } from "./_shopify.js";

const SHOPIFY_LOCATION_ID = "gid://shopify/Location/79362425046"; // Clínica

// Motivos que entiende la app → razones oficiales de Shopify (aparecen en el
// historial de inventario del admin).
const MOTIVOS = {
  recibido: "received",
  venta: "other",
  correccion: "correction",
};

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

  const { productId, variantId, inventoryItemId, delta, motivo } = req.body || {};
  const cambio = Number(delta);
  if (!Number.isInteger(cambio) || cambio === 0) {
    res.status(400).json({ ok: false, error: "El delta debe ser un número entero distinto de cero." });
    return;
  }
  if (!inventoryItemId && !variantId) {
    res.status(400).json({ ok: false, error: "Falta inventoryItemId o variantId." });
    return;
  }

  try {
    // Si solo tenemos el ID de la variante, resolvemos el inventory item asociado.
    let itemId = inventoryItemId;
    if (!itemId) {
      const variantData = await shopifyGraphql(
        config,
        `query($id: ID!) { productVariant(id: $id) { inventoryItem { id } } }`,
        { id: variantId }
      );
      itemId = variantData?.productVariant?.inventoryItem?.id;
      if (!itemId) {
        res.status(200).json({ ok: false, error: "No se encontró el inventory item de esa variante." });
        return;
      }
    }

    const data = await shopifyGraphql(
      config,
      `mutation($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) {
          inventoryAdjustmentGroup {
            changes { name delta quantityAfterChange }
          }
          userErrors { field message }
        }
      }`,
      {
        input: {
          reason: MOTIVOS[motivo] || "correction",
          name: "available",
          changes: [{ delta: cambio, inventoryItemId: itemId, locationId: SHOPIFY_LOCATION_ID }],
        },
      }
    );

    const errors = data?.inventoryAdjustQuantities?.userErrors;
    if (errors && errors.length > 0) {
      res.status(200).json({ ok: false, error: errors.map((e) => e.message).join(", ") });
      return;
    }

    const cambios = data?.inventoryAdjustQuantities?.inventoryAdjustmentGroup?.changes || [];
    const disponible = cambios.find((c) => c.name === "available");
    let stockNuevo = disponible ? disponible.quantityAfterChange : null;

    // Algunas respuestas de Shopify no traen el total nuevo — lo consultamos
    // directo para que la app siempre muestre el stock real.
    if (stockNuevo == null) {
      try {
        const nivel = await shopifyGraphql(
          config,
          `query($id: ID!, $locationId: ID!) {
            inventoryItem(id: $id) {
              inventoryLevel(locationId: $locationId) {
                quantities(names: ["available"]) { quantity }
              }
            }
          }`,
          { id: itemId, locationId: SHOPIFY_LOCATION_ID }
        );
        stockNuevo = nivel?.inventoryItem?.inventoryLevel?.quantities?.[0]?.quantity ?? null;
      } catch (err) {
        // Sin el total no pasa nada: la app lo calcula localmente.
      }
    }

    // Si fue una recepción, quitamos el producto de la lista de pedidos.
    // Si esto falla no arruinamos la operación: el stock ya quedó bien sumado.
    if (motivo === "recibido" && productId) {
      try {
        await shopifyGraphql(
          config,
          `mutation($metafields: [MetafieldIdentifierInput!]!) {
            metafieldsDelete(metafields: $metafields) { userErrors { field message } }
          }`,
          { metafields: [{ ownerId: productId, namespace: "inventario", key: "pedido" }] }
        );
      } catch (err) {
        // El pedido seguirá apareciendo en la lista; se puede quitar a mano.
      }
    }

    res.status(200).json({ ok: true, stockNuevo });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message || "No se pudo conectar con Shopify." });
  }
}
