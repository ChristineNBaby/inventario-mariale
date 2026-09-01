// Registro COMPARTIDO de ventas de la semana. Vive en un metafield privado de la
// app EN SHOPIFY (owner = la propia instalación de la app, namespace "inventario",
// key "ventas"), así:
//   - todos los iPads/celulares de la clínica ven el MISMO reporte,
//   - queda guardado permanentemente en Shopify (no se pierde al cerrar la app),
//   - solo se conservan los últimos 7 días (se limpia solo).
//
// Métodos:
//   GET                      -> devuelve { ok, ventas: [...] } con la última semana
//   POST { accion:"agregar", venta }   -> añade una venta
//   POST { accion:"cancelar", id }     -> quita una venta por id
//
// La app además sigue guardando cada venta en el teléfono (respaldo sin conexión)
// y en la hoja de Google (historial permanente completo).
import { leerConfig, shopifyGraphql } from "./_shopify.js";

const NAMESPACE = "inventario";
const KEY = "ventas";
const DIAS_A_CONSERVAR = 7;

// Solo deja las ventas de los últimos N días.
function soloUltimaSemana(ventas) {
  const limite = Date.now() - DIAS_A_CONSERVAR * 24 * 60 * 60 * 1000;
  return ventas.filter((v) => {
    const t = Date.parse(v.fecha);
    return isNaN(t) ? true : t >= limite;
  });
}

// Devuelve el id de la instalación de la app (owner de nuestro metafield privado)
// y las ventas guardadas actualmente.
async function leerEstado(config) {
  const data = await shopifyGraphql(
    config,
    `query {
      currentAppInstallation {
        id
        metafield(namespace: "${NAMESPACE}", key: "${KEY}") { value }
      }
    }`,
    {}
  );
  const inst = data?.currentAppInstallation;
  const ownerId = inst?.id || null;
  let ventas = [];
  const raw = inst?.metafield?.value;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) ventas = parsed;
    } catch (err) {
      ventas = [];
    }
  }
  return { ownerId, ventas };
}

// Guarda la lista completa de ventas en el metafield de la app.
async function guardarVentas(config, ownerId, ventas) {
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
        ownerId,
        namespace: NAMESPACE,
        key: KEY,
        type: "json",
        value: JSON.stringify(ventas),
      }],
    }
  );
  const errors = data?.metafieldsSet?.userErrors;
  if (errors && errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
}

export default async function handler(req, res) {
  const config = leerConfig();
  if (!config) {
    res.status(200).json({ ok: false, error: "Shopify no está configurado todavía (faltan variables de entorno en el servidor)." });
    return;
  }

  try {
    if (req.method === "GET") {
      const { ventas } = await leerEstado(config);
      res.status(200).json({ ok: true, ventas: soloUltimaSemana(ventas) });
      return;
    }

    if (req.method === "POST") {
      const { accion, venta, id } = req.body || {};
      const { ownerId, ventas } = await leerEstado(config);
      if (!ownerId) {
        res.status(200).json({ ok: false, error: "No se encontró la instalación de la app en Shopify." });
        return;
      }

      let nuevas = soloUltimaSemana(ventas);

      if (accion === "agregar") {
        if (!venta || venta.id == null) {
          res.status(400).json({ ok: false, error: "Falta la venta a agregar." });
          return;
        }
        // Evita duplicados si el mismo aparato reintenta.
        if (!nuevas.some((v) => v.id === venta.id)) {
          nuevas.push(venta);
        }
      } else if (accion === "cancelar") {
        if (id == null) {
          res.status(400).json({ ok: false, error: "Falta el id de la venta a cancelar." });
          return;
        }
        nuevas = nuevas.filter((v) => v.id !== id);
      } else {
        res.status(400).json({ ok: false, error: "Acción no válida (agregar o cancelar)." });
        return;
      }

      await guardarVentas(config, ownerId, nuevas);
      res.status(200).json({ ok: true, ventas: nuevas });
      return;
    }

    res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message || "No se pudo conectar con Shopify." });
  }
}
