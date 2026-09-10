// Crea un PRODUCTO NUEVO en Shopify desde la app, para que quede guardado para
// siempre y aparezca en todos los aparatos (con su stock en la ubicación Clínica).
//
// Pasos (todo con la conexión de Shopify que ya usa la app):
//   1. productCreate  -> crea el producto ACTIVO y su variante por defecto.
//   2. productVariantsBulkUpdate -> le pone el precio y, si es "producto",
//      activa el seguimiento de inventario (tracked).
//   3. Para un "producto": activa el inventory item en la ubicación Clínica
//      (inventoryActivate) y le pone la cantidad inicial (inventorySetQuantities).
//
// Un "servicio" (consulta, terapia…) se crea SIN seguimiento de inventario.
//
// Body: { nombre, precio, tipo: "producto"|"servicio", stock }
import { leerConfig, shopifyGraphql } from "./_shopify.js";

const SHOPIFY_LOCATION_CLINICA = "gid://shopify/Location/79362425046"; // Clínica

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const config = leerConfig();
  if (!config) {
    res.status(200).json({ ok: false, error: "Shopify no está configurado todavía (faltan variables de entorno en el servidor)." });
    return;
  }

  const { nombre, precio, tipo, stock } = req.body || {};
  const titulo = (nombre || "").trim();
  if (!titulo) {
    res.status(400).json({ ok: false, error: "El producto necesita un nombre." });
    return;
  }
  const esProducto = tipo !== "servicio";
  const precioNum = Number(precio) || 0;
  const stockNum = Math.max(0, Math.round(Number(stock) || 0));

  try {
    // 1. Crear el producto activo (con su variante por defecto).
    const creado = await shopifyGraphql(
      config,
      `mutation($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            variants(first: 1) { nodes { id inventoryItem { id } } }
          }
          userErrors { field message }
        }
      }`,
      { input: { title: titulo, status: "ACTIVE" } }
    );
    const errC = creado?.productCreate?.userErrors;
    if (errC && errC.length > 0) {
      res.status(200).json({ ok: false, error: errC.map((e) => e.message).join(", ") });
      return;
    }
    const producto = creado?.productCreate?.product;
    const variante = producto?.variants?.nodes?.[0];
    const variantId = variante?.id;
    const inventoryItemId = variante?.inventoryItem?.id;
    if (!variantId) {
      res.status(200).json({ ok: false, error: "Shopify no devolvió la variante del producto nuevo." });
      return;
    }

    // 2. Precio + (si es producto) activar seguimiento de inventario.
    const varInput = { id: variantId, price: String(precioNum) };
    if (esProducto) varInput.inventoryItem = { tracked: true };
    const actualizado = await shopifyGraphql(
      config,
      `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          userErrors { field message }
        }
      }`,
      { productId: producto.id, variants: [varInput] }
    );
    const errU = actualizado?.productVariantsBulkUpdate?.userErrors;
    if (errU && errU.length > 0) {
      res.status(200).json({ ok: false, error: errU.map((e) => e.message).join(", ") });
      return;
    }

    // 3. Para un producto: activar el inventario en Clínica y poner la cantidad.
    if (esProducto && inventoryItemId) {
      // Activa el inventory item en la ubicación Clínica (si ya estaba, no pasa nada).
      const activado = await shopifyGraphql(
        config,
        `mutation($inventoryItemId: ID!, $locationId: ID!) {
          inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId) {
            userErrors { field message }
          }
        }`,
        { inventoryItemId, locationId: SHOPIFY_LOCATION_CLINICA }
      );
      const errA = activado?.inventoryActivate?.userErrors;
      if (errA && errA.length > 0) {
        res.status(200).json({ ok: false, error: "Producto creado, pero no se pudo activar el inventario: " + errA.map((e) => e.message).join(", ") });
        return;
      }
      // Pone la cantidad inicial (mismo patrón que el resto de la app).
      const puesto = await shopifyGraphql(
        config,
        `mutation($input: InventorySetQuantitiesInput!) {
          inventorySetQuantities(input: $input) {
            userErrors { field message }
          }
        }`,
        {
          input: {
            reason: "correction",
            name: "available",
            ignoreCompareQuantity: true,
            quantities: [{ inventoryItemId, locationId: SHOPIFY_LOCATION_CLINICA, quantity: stockNum }],
          },
        }
      );
      const errS = puesto?.inventorySetQuantities?.userErrors;
      if (errS && errS.length > 0) {
        res.status(200).json({ ok: false, error: "Producto creado, pero no se pudo poner la cantidad: " + errS.map((e) => e.message).join(", ") });
        return;
      }
    }

    res.status(200).json({
      ok: true,
      producto: {
        shopifyProductId: producto.id,
        shopifyVariantId: variantId,
        inventoryItemId: inventoryItemId || null,
        nombre: titulo,
        tipo: esProducto ? "producto" : "servicio",
        precio: precioNum,
        stock: esProducto ? stockNum : null,
      },
    });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message || "No se pudo conectar con Shopify." });
  }
}
