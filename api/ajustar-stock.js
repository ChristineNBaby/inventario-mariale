// Ajusta el stock en Shopify SUMANDO o RESTANDO una cantidad (delta), en vez de
// sobreescribir el total. Así, si dos personas mueven inventario al mismo tiempo,
// Shopify hace la suma correcta y nadie pisa el cambio del otro.
//   - Una venta manda delta negativo (motivo "venta").
//   - Una recepción de pedido manda delta positivo (motivo "recibido") y además
//     quita el producto de la lista de pedidos pendientes.
//
// IMPORTANTE — dos ubicaciones: el inventario de la tienda está repartido entre
// "Clínica" y "Shop location". Para no crear números negativos ni descuadres,
// el ajuste se aplica en la ubicación que HOY tiene existencias del producto
// (la de mayor cantidad). Si ninguna tiene, usamos "Clínica" (donde llega la
// mercadería nueva). El stock que devolvemos es el TOTAL de todas las ubicaciones.
import { leerConfig, shopifyGraphql } from "./_shopify.js";

const SHOPIFY_LOCATION_CLINICA = "gid://shopify/Location/79362425046"; // Clínica

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
    // Resolvemos el inventory item (desde la variante si hace falta) y de paso
    // leemos cuánto hay en cada ubicación, para saber dónde aplicar el ajuste.
    const itemData = await shopifyGraphql(
      config,
      inventoryItemId
        ? `query($id: ID!) {
            inventoryItem(id: $id) {
              id
              inventoryLevels(first: 20) {
                edges { node { location { id } quantities(names: ["available"]) { quantity } } }
              }
            }
          }`
        : `query($id: ID!) {
            productVariant(id: $id) {
              inventoryItem {
                id
                inventoryLevels(first: 20) {
                  edges { node { location { id } quantities(names: ["available"]) { quantity } } }
                }
              }
            }
          }`,
      { id: inventoryItemId || variantId }
    );

    const item = inventoryItemId ? itemData?.inventoryItem : itemData?.productVariant?.inventoryItem;
    const itemId = item?.id;
    if (!itemId) {
      res.status(200).json({ ok: false, error: "No se encontró el inventory item del producto." });
      return;
    }

    const niveles = (item.inventoryLevels?.edges || []).map((e) => ({
      locationId: e.node.location.id,
      cantidad: e.node.quantities?.[0]?.quantity ?? 0,
    }));

    // Ubicación objetivo: la que más existencias tiene hoy. Si ninguna tiene
    // (producto agotado o recién llegado), usamos Clínica.
    let objetivo = SHOPIFY_LOCATION_CLINICA;
    let mejor = -Infinity;
    for (const n of niveles) {
      if (n.cantidad > mejor) {
        mejor = n.cantidad;
        objetivo = n.locationId;
      }
    }
    if (mejor <= 0) objetivo = SHOPIFY_LOCATION_CLINICA;

    const data = await shopifyGraphql(
      config,
      `mutation($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) {
          inventoryAdjustmentGroup { changes { name delta quantityAfterChange } }
          userErrors { field message }
        }
      }`,
      {
        input: {
          reason: MOTIVOS[motivo] || "correction",
          name: "available",
          changes: [{ delta: cambio, inventoryItemId: itemId, locationId: objetivo }],
        },
      }
    );

    const errors = data?.inventoryAdjustQuantities?.userErrors;
    if (errors && errors.length > 0) {
      res.status(200).json({ ok: false, error: errors.map((e) => e.message).join(", ") });
      return;
    }

    // Nuevo total = suma de todas las ubicaciones. Partimos del total que ya
    // teníamos (antes del ajuste) y le sumamos el delta: siempre correcto sin
    // importar en qué ubicación cayó el cambio.
    const totalAntes = niveles.reduce((s, n) => s + n.cantidad, 0);
    const stockNuevo = totalAntes + cambio;

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
