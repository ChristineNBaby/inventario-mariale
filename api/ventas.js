// Registro COMPARTIDO y PERMANENTE de ventas. Vive en metafields privados de la
// app EN SHOPIFY (owner = la propia instalación de la app, namespace "inventario"),
// así:
//   - todos los iPads/celulares de la clínica ven el MISMO reporte,
//   - queda guardado permanentemente en Shopify (no se pierde, NO se borra),
//   - se conserva TODO el historial.
//
// Para que quepa todo sin toparse con el límite de tamaño de un metafield, las
// ventas se guardan en UNA BOLSA POR MES: key "ventas_AAAA-MM" (ej "ventas_2026-09").
// Cada mes es una lista pequeña; se pueden acumular años de meses sin problema.
//
// Métodos:
//   GET                                -> { ok, ventas: [...] } con TODO el historial
//   POST { accion:"agregar", venta }   -> añade una venta a la bolsa de su mes
//   POST { accion:"cancelar", id }     -> quita una venta por id (busca en todos los meses)
//
// La app además guarda cada venta en el teléfono (respaldo sin conexión) y en la
// hoja de Google (historial permanente completo, aparte).
import { leerConfig, shopifyGraphql } from "./_shopify.js";

const NAMESPACE = "inventario";
const PREFIJO = "ventas_"; // las keys de las bolsas mensuales empiezan así

// Devuelve la key de la bolsa mensual para una fecha ISO (ej "ventas_2026-09").
function keyDelMes(fechaIso) {
  const d = fechaIso ? new Date(fechaIso) : new Date();
  const t = isNaN(d.getTime()) ? new Date() : d;
  const mes = String(t.getUTCMonth() + 1).padStart(2, "0");
  return `${PREFIJO}${t.getUTCFullYear()}-${mes}`;
}

// Id de la instalación de la app (owner de nuestros metafields privados).
async function leerOwnerId(config) {
  const data = await shopifyGraphql(config, `query { currentAppInstallation { id } }`, {});
  return data?.currentAppInstallation?.id || null;
}

// Lee TODAS las bolsas mensuales (keys "ventas_*") y devuelve un mapa
// { key -> [ventas] } además de la lista combinada.
async function leerTodasLasBolsas(config) {
  const data = await shopifyGraphql(
    config,
    `query {
      currentAppInstallation {
        metafields(namespace: "${NAMESPACE}", first: 100) {
          edges { node { key value } }
        }
      }
    }`,
    {}
  );
  const edges = data?.currentAppInstallation?.metafields?.edges || [];
  const bolsas = {};
  for (const { node } of edges) {
    if (!node.key.startsWith(PREFIJO)) continue;
    try {
      const parsed = JSON.parse(node.value);
      if (Array.isArray(parsed)) bolsas[node.key] = parsed;
    } catch (err) {
      bolsas[node.key] = [];
    }
  }
  return bolsas;
}

// Lee una sola bolsa mensual por su key.
async function leerBolsa(config, key) {
  const data = await shopifyGraphql(
    config,
    `query {
      currentAppInstallation {
        metafield(namespace: "${NAMESPACE}", key: "${key}") { value }
      }
    }`,
    {}
  );
  const raw = data?.currentAppInstallation?.metafield?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

// Guarda una bolsa mensual completa.
async function guardarBolsa(config, ownerId, key, ventas) {
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
        key,
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
      const bolsas = await leerTodasLasBolsas(config);
      const todas = Object.values(bolsas).flat();
      todas.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
      res.status(200).json({ ok: true, ventas: todas });
      return;
    }

    if (req.method === "POST") {
      const { accion, venta, id } = req.body || {};
      const ownerId = await leerOwnerId(config);
      if (!ownerId) {
        res.status(200).json({ ok: false, error: "No se encontró la instalación de la app en Shopify." });
        return;
      }

      if (accion === "agregar") {
        if (!venta || venta.id == null) {
          res.status(400).json({ ok: false, error: "Falta la venta a agregar." });
          return;
        }
        const key = keyDelMes(venta.fecha);
        const bolsa = await leerBolsa(config, key);
        // Evita duplicados si el mismo aparato reintenta.
        if (!bolsa.some((v) => v.id === venta.id)) {
          bolsa.push(venta);
          await guardarBolsa(config, ownerId, key, bolsa);
        }
        res.status(200).json({ ok: true });
        return;
      }

      if (accion === "cancelar") {
        if (id == null) {
          res.status(400).json({ ok: false, error: "Falta el id de la venta a cancelar." });
          return;
        }
        // Busca en qué bolsa mensual está esa venta y solo reescribe esa.
        const bolsas = await leerTodasLasBolsas(config);
        for (const [key, ventas] of Object.entries(bolsas)) {
          if (ventas.some((v) => v.id === id)) {
            await guardarBolsa(config, ownerId, key, ventas.filter((v) => v.id !== id));
            break;
          }
        }
        res.status(200).json({ ok: true });
        return;
      }

      res.status(400).json({ ok: false, error: "Acción no válida (agregar o cancelar)." });
      return;
    }

    res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message || "No se pudo conectar con Shopify." });
  }
}
