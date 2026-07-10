// Trae todos los productos reales de Shopify (con precio, foto, stock TOTAL y
// estado de pedido) para mostrarlos en la app.
//
// El stock se SUMA de todas las ubicaciones (Clínica + Shop location). El
// inventario de esta tienda está repartido entre las dos, así que mirar una
// sola daría números falsos (p. ej. un producto con 9 unidades en "Shop
// location" se vería como 0). El total es lo que importa para la clínica.
import { leerConfig, shopifyGraphql } from "./_shopify.js";

// El estado de pedido vive como JSON en un metafield del producto.
// Si el valor está corrupto o vacío, lo tratamos como "sin pedido".
function parsePedido(valor) {
  if (!valor) return null;
  try {
    const pedido = JSON.parse(valor);
    return pedido && pedido.estado ? pedido : null;
  } catch (err) {
    return null;
  }
}

export default async function handler(req, res) {
  const config = leerConfig();
  if (!config) {
    res.status(500).json({ ok: false, error: "Shopify no está configurado todavía (faltan variables de entorno en el servidor)." });
    return;
  }

  try {
    const data = await shopifyGraphql(
      config,
      `query {
        products(first: 250, sortKey: TITLE, query: "status:active") {
          edges {
            node {
              id
              title
              featuredImage { url }
              metafield(namespace: "inventario", key: "pedido") { value }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                    inventoryItem {
                      id
                      tracked
                      inventoryLevels(first: 20) {
                        edges { node { quantities(names: ["available"]) { quantity } } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`
    );

    const productos = (data?.products?.edges || [])
      .filter(({ node }) => node.variants.edges[0]?.node?.inventoryItem?.tracked)
      .map(({ node }, i) => {
        const variant = node.variants.edges[0]?.node;
        // Sumamos las existencias de todas las ubicaciones.
        const niveles = variant?.inventoryItem?.inventoryLevels?.edges || [];
        const cantidad = niveles.reduce((s, e) => s + (e.node.quantities?.[0]?.quantity ?? 0), 0);
        return {
          id: i + 1,
          shopifyProductId: node.id,
          shopifyVariantId: variant?.id || null,
          inventoryItemId: variant?.inventoryItem?.id || null,
          nombre: node.title,
          tipo: "producto",
          precio: Math.round(parseFloat(variant?.price || "0")),
          metodoPago: "Efectivo",
          stock: cantidad,
          foto: node.featuredImage?.url || null,
          pedido: parsePedido(node.metafield?.value),
        };
      });

    res.status(200).json({ ok: true, productos });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message || "No se pudo conectar con Shopify." });
  }
}
