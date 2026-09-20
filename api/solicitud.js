// Recibe una SOLICITUD de productos desde la tienda (drmarialerivers.com) y crea
// un PEDIDO BORRADOR en Shopify, listo para que la secretaria lo revise y envíe
// el enlace de pago.
//
// Por qué existe: los productos de terapia hormonal no se pagan en línea
// directamente (solo para pacientes de la Dra., bajo receta médica). La paciente
// llena sus datos en /pages/solicitar y esto le arma el borrador a la clínica,
// sin cobrar nada todavía.
//
// El borrador queda etiquetado "solicitud-web" para distinguirlo de los pedidos
// que la secretaria crea a mano.
//
// Body: { nombre, correo, telefono, comentarios, items: [{ variantId, cantidad }] }
import { leerConfig, shopifyGraphql } from "./_shopify.js";

const ORIGENES_PERMITIDOS = [
  "https://drmarialerivers.com",
  "https://www.drmarialerivers.com",
  "https://marialerivers.myshopify.com",
];

function ponerCors(req, res) {
  const origen = req.headers.origin;
  if (origen && ORIGENES_PERMITIDOS.includes(origen)) {
    res.setHeader("Access-Control-Allow-Origin", origen);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  ponerCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const config = leerConfig();
  if (!config) {
    res.status(200).json({ ok: false, error: "Shopify no está configurado en el servidor." });
    return;
  }

  const { nombre, correo, telefono, comentarios, items, trampa } = req.body || {};

  // Campo trampa para robots: si viene lleno, fingimos éxito y no hacemos nada.
  if (trampa) {
    res.status(200).json({ ok: true });
    return;
  }

  const nombreLimpio = (nombre || "").trim();
  const correoLimpio = (correo || "").trim();
  const telefonoLimpio = (telefono || "").trim();
  const comentariosLimpios = (comentarios || "").trim();

  if (!correoLimpio) {
    res.status(400).json({ ok: false, error: "Falta el correo." });
    return;
  }

  const lineas = Array.isArray(items)
    ? items
        .map((item) => ({
          variantId: String(item?.variantId || "").trim(),
          quantity: Math.max(1, Math.round(Number(item?.cantidad) || 1)),
        }))
        .filter((item) => /^\d+$/.test(item.variantId))
        .slice(0, 50)
    : [];

  if (lineas.length === 0) {
    res.status(400).json({ ok: false, error: "La solicitud no trae productos." });
    return;
  }

  const notaPartes = [`Solicitud enviada desde la tienda en línea.`];
  if (nombreLimpio) notaPartes.push(`Nombre: ${nombreLimpio}`);
  if (telefonoLimpio) notaPartes.push(`Teléfono / WhatsApp: ${telefonoLimpio}`);
  if (comentariosLimpios) notaPartes.push(`Comentarios de la paciente: ${comentariosLimpios}`);
  notaPartes.push("");
  notaPartes.push("Revisar antes de enviar la factura.");

  try {
    const resultado = await shopifyGraphql(
      config,
      `mutation($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            name
            invoiceUrl
            totalPriceSet { shopMoney { amount currencyCode } }
          }
          userErrors { field message }
        }
      }`,
      {
        input: {
          email: correoLimpio,
          phone: telefonoLimpio || null,
          note: notaPartes.join("\n"),
          tags: ["solicitud-web"],
          lineItems: lineas.map((linea) => ({
            variantId: `gid://shopify/ProductVariant/${linea.variantId}`,
            quantity: linea.quantity,
          })),
        },
      }
    );

    const errores = resultado?.draftOrderCreate?.userErrors;
    if (errores && errores.length > 0) {
      res.status(200).json({ ok: false, error: errores.map((e) => e.message).join(", ") });
      return;
    }

    const borrador = resultado?.draftOrderCreate?.draftOrder;
    res.status(200).json({
      ok: true,
      pedido: borrador?.name || null,
      enlacePago: borrador?.invoiceUrl || null,
      total: borrador?.totalPriceSet?.shopMoney?.amount || null,
    });
  } catch (err) {
    // La página de la tienda igual manda el correo de respaldo, así que un fallo
    // aquí nunca hace que se pierda la solicitud.
    res.status(200).json({ ok: false, error: String(err.message || err) });
  }
}
