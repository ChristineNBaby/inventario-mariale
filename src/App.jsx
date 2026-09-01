import React, { useState, useEffect, useRef } from "react";
import { Plus, Package, Receipt, Search, X, Camera, TrendingDown, DollarSign, RefreshCw, CreditCard, Banknote, Landmark, Calendar, Link2, ListChecks, ShoppingCart, PackageCheck, ClipboardList, Truck, Hourglass, QrCode, Printer, ScanLine, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// ---------- Paleta Dr. Mariale Rivers ----------
// Fondo:      #F7F4EC (crema natural)
// Superficie: #FFFFFF
// Verde:      #4B6B4F (verde ayurvédico, acento principal)
// Verde osc:  #2F4A33 (texto fuerte / headers)
// Morado:     #6B4E71 (acento secundario, servicios)
// Ámbar:      #C89B3C (dorado / alertas suaves)
// Óxido:      #A6402F (alerta stock bajo)
// Arena:      #E4DFCE (bordes suaves)

// Productos reales traídos de Shopify (drmarialerivers.com) — grupo de prueba
const initialProducts = [
  { id: 1, shopifyProductId: "gid://shopify/Product/8812264128726", shopifyVariantId: "gid://shopify/ProductVariant/46385785929942", nombre: "Sudanta Gel dental Neem y carbón activado", tipo: "producto", precio: 45, metodoPago: "Efectivo", stock: 14, foto: "https://cdn.shopify.com/s/files/1/0711/2428/7702/files/2.png?v=1737903040" },
  { id: 2, shopifyProductId: "gid://shopify/Product/8960535036118", shopifyVariantId: "gid://shopify/ProductVariant/46808605589718", nombre: "Herbal Hair", tipo: "producto", precio: 130, metodoPago: "Tarjeta", stock: 10, foto: null },
  { id: 3, shopifyProductId: "gid://shopify/Product/8812276351190", shopifyVariantId: "gid://shopify/ProductVariant/46385806901462", nombre: "Boswelia - ATMA apothecary", tipo: "producto", precio: 150, metodoPago: "Tarjeta", stock: 9, foto: "https://cdn.shopify.com/s/files/1/0711/2428/7702/files/IMG-2075.png?v=1752802375" },
  { id: 4, shopifyProductId: "gid://shopify/Product/9016516640982", shopifyVariantId: "gid://shopify/ProductVariant/46966172909782", nombre: "Morphosis", tipo: "producto", precio: 400, metodoPago: "Tarjeta", stock: 8, foto: "https://cdn.shopify.com/s/files/1/0711/2428/7702/files/16.png?v=1737903038" },
  { id: 5, shopifyProductId: "gid://shopify/Product/8960489554134", shopifyVariantId: "gid://shopify/ProductVariant/46808515838166", nombre: "Evecare", tipo: "producto", precio: 160, metodoPago: "Efectivo", stock: 8, foto: "https://cdn.shopify.com/s/files/1/0711/2428/7702/files/ATMA_2025-_PRODUCTS_5fc0d657-2898-4792-91c0-e8c4ea911a3e.png?v=1782931487" },
  { id: 6, shopifyProductId: "gid://shopify/Product/8812278481110", shopifyVariantId: "gid://shopify/ProductVariant/46385811194070", nombre: "Raíz de Regaliz - ATMA", tipo: "producto", precio: 150, metodoPago: "Tarjeta", stock: 8, foto: "https://cdn.shopify.com/s/files/1/0711/2428/7702/files/IMG-2022.png?v=1752801358" },
  { id: 7, shopifyProductId: "gid://shopify/Product/8812273205462", shopifyVariantId: "gid://shopify/ProductVariant/46385799397590", nombre: "Mahanarayan Oil - Aceite Ayurvédico", tipo: "producto", precio: 130, metodoPago: "Efectivo", stock: 8, foto: "https://cdn.shopify.com/s/files/1/0711/2428/7702/files/17.png?v=1737903039" },
  { id: 8, shopifyProductId: "gid://shopify/Product/8812272681174", shopifyVariantId: "gid://shopify/ProductVariant/46385796939990", nombre: "Himcocid Himalaya", tipo: "producto", precio: 85, metodoPago: "Efectivo", stock: 8, foto: "https://cdn.shopify.com/s/files/1/0711/2428/7702/files/15.png?v=1737903041" },
  { id: 9, shopifyProductId: "gid://shopify/Product/8960516980950", shopifyVariantId: "gid://shopify/ProductVariant/46808564498646", nombre: "Ixbulac - Apoya lactancia", tipo: "producto", precio: 160, metodoPago: "Tarjeta", stock: 7, foto: "https://cdn.shopify.com/s/files/1/0711/2428/7702/files/Ixbulac.png?v=1746470643" },
  { id: 10, shopifyProductId: "gid://shopify/Product/8812290670806", shopifyVariantId: "gid://shopify/ProductVariant/46385837244630", nombre: "Brahmi", tipo: "producto", precio: 150, metodoPago: "Tarjeta", stock: 7, foto: "https://cdn.shopify.com/s/files/1/0711/2428/7702/files/IMG-5936.png?v=1766441895" },
];

const metodosPago = [
  { key: "Efectivo", icon: Banknote },
  { key: "Tarjeta", icon: CreditCard },
  { key: "Transferencia", icon: Landmark },
];

// ---------- Conexión con Shopify ----------
// Ubicación física "Clínica" en Shopify — todas las ventas presenciales descuentan de aquí,
// el mismo lugar de donde también descuentan las ventas en línea.
const SHOPIFY_LOCATION_ID = "gid://shopify/Location/79362425046"; // Clínica

// La llave de acceso a Shopify ya no vive aquí ni en ninguna variable VITE_ (esas
// terminan expuestas en el navegador). Vive solo en el servidor, dentro de /api,
// y este código le pide a esas funciones que hagan el trabajo por nosotros.

// Regla del equipo: cuando quedan MENOS de 2 unidades, hay que pedir más.
// La pestaña "Pedidos" arma sola la lista de "por pedir" con este número.
const UMBRAL_PEDIDO = 2;

// Descuenta el stock de un producto en Shopify (ubicación "Clínica") a través de
// /api/ajustar-stock. Manda un delta (-cantidad) en vez del total: Shopify hace la
// resta, así aunque dos personas vendan al mismo tiempo nadie pisa el cambio del
// otro. Devuelve { ok, stockNuevo } o { ok: false, error } — la venta en la app se
// guarda de todos modos, para nunca perder el registro.
async function descontarStockEnShopify(variantId, cantidadVendida) {
  try {
    const response = await fetch("/api/ajustar-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, delta: -cantidadVendida, motivo: "venta" }),
    });
    return await response.json();
  } catch (err) {
    return { ok: false, error: "No se pudo conectar con el servidor. Se guardó la venta localmente." };
  }
}

function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-[#E4DFCE] text-[#2F4A33]",
    low: "bg-[#A6402F]/10 text-[#A6402F]",
    ok: "bg-[#4B6B4F]/12 text-[#4B6B4F]",
    servicio: "bg-[#6B4E71]/12 text-[#6B4E71]",
    pedido: "bg-[#C89B3C]/15 text-[#7A5B14]",
  };
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${tones[tone]}`}>{children}</span>;
}

function MetodoIcon({ metodo, className }) {
  const found = metodosPago.find((m) => m.key === metodo);
  const Icon = found ? found.icon : Banknote;
  return <Icon className={className} />;
}

function ProductCard({ p, onSell, onEdit }) {
  const bajo = p.tipo === "producto" && p.stock <= 3;
  return (
    <div className="bg-white rounded-2xl border border-[#E4DFCE] p-4 flex gap-4 shadow-sm">
      <div className="w-20 h-20 rounded-xl bg-[#F7F4EC] border border-[#E4DFCE] flex items-center justify-center overflow-hidden shrink-0">
        {p.foto ? (
          <img src={p.foto} alt={p.nombre} className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-6 h-6 text-[#4B6B4F]/40" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[#2F4A33] leading-snug truncate">{p.nombre}</h3>
          <span className="font-serif text-[#4B6B4F] font-bold whitespace-nowrap">Q{p.precio}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge tone={p.tipo === "servicio" ? "servicio" : "default"}>
            {p.tipo === "producto" ? "Producto" : "Servicio"}
          </Badge>
          {p.tipo === "producto" && (
            <Badge tone={bajo ? "low" : "ok"}>{bajo ? "Stock bajo: " : "Stock: "}{p.stock}</Badge>
          )}
          {p.pedido?.estado === "pedido" && (
            <Badge tone="pedido">Pedido: {p.pedido.cantidad ?? "—"}</Badge>
          )}
          {p.pedido?.estado === "backorder" && (
            <Badge tone="servicio">
              {p.pedido.hastaFecha ? `Agotado, regresa ${formatearFecha(p.pedido.hastaFecha)}` : "Agotado hasta confirmación"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-[#8A8368] mt-1">{p.metodoPago}</p>
        <div className="flex gap-2 mt-3">
          <button onClick={() => onSell(p)} className="text-xs font-medium bg-[#4B6B4F] text-white px-3 py-1.5 rounded-lg hover:bg-[#3A5540] transition">
            Registrar venta
          </button>
          <button onClick={() => onEdit(p)} className="text-xs font-medium border border-[#E4DFCE] text-[#2F4A33] px-3 py-1.5 rounded-lg hover:bg-[#F7F4EC] transition">
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-[#2F2A1F]/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-[#F7F4EC] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-bold text-[#2F4A33]">{title}</h2>
          <button onClick={onClose} className="text-[#8A8368] hover:text-[#2F4A33]"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState(initialProducts);
  // Las ventas se guardan en el teléfono (localStorage) para que sirvan de
  // registro y no se pierdan al cerrar o recargar la app. No se envían a Shopify.
  const [sales, setSales] = useState(() => {
    try {
      const guardado = localStorage.getItem("ventas_clinica");
      return guardado ? JSON.parse(guardado) : [];
    } catch (err) {
      return [];
    }
  });
  const [tab, setTab] = useState("inventario");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sellTarget, setSellTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [shopifySynced, setShopifySynced] = useState(false);
  const [confirmacionStock, setConfirmacionStock] = useState(null);
  const [showResumen, setShowResumen] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [pedidoTarget, setPedidoTarget] = useState(null);
  const [recibirTarget, setRecibirTarget] = useState(null);
  const [backorderTarget, setBackorderTarget] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [reporteVista, setReporteVista] = useState("dia");
  const qrManejado = useRef(false);

  // Trae el catálogo real y actualizado desde Shopify (productos, stock y estado
  // de pedidos). Si falla (sin conexión, Shopify no configurado, etc.), se queda
  // con los productos de prueba para que la app siga siendo utilizable.
  function cargarProductos() {
    setCargandoProductos(true);
    fetch("/api/get-products")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.productos?.length > 0) {
          setProducts(data.productos);
          setShopifySynced(true);
        }
      })
      .catch(() => {})
      .finally(() => setCargandoProductos(false));
  }

  useEffect(() => {
    cargarProductos();
    cargarVentasCompartidas();
  }, []);

  // Si la app se abre desde un código QR (…?vender=IDVARIANTE), abre directo la
  // pantalla de "Registrar venta" de ese producto una vez que cargó el catálogo.
  useEffect(() => {
    if (qrManejado.current || cargandoProductos) return;
    const params = new URLSearchParams(window.location.search);
    const venderId = params.get("vender");
    if (!venderId) return;
    const prod = products.find((p) => p.shopifyVariantId && p.shopifyVariantId.split("/").pop() === venderId);
    if (prod) {
      qrManejado.current = true;
      setTab("inventario");
      setSellTarget(prod);
      // Limpia el parámetro de la URL para que no se reabra al recargar.
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [products, cargandoProductos]);

  // Cada vez que cambian las ventas, las guarda en el teléfono.
  useEffect(() => {
    try {
      localStorage.setItem("ventas_clinica", JSON.stringify(sales));
    } catch (err) {}
  }, [sales]);

  function mostrarAviso(texto, tono = "ok") {
    setAviso({ texto, tono });
    setTimeout(() => setAviso(null), 4500);
  }

  // El escáner leyó un código QR. El QR trae la dirección del producto
  // (…?vender=IDVARIANTE). Sacamos ese id, buscamos el producto en el
  // inventario y abrimos directo la pantalla de "Registrar venta".
  function handleScan(textoLeido) {
    let venderId = null;
    try {
      venderId = new URL(textoLeido).searchParams.get("vender");
    } catch (err) {
      const m = textoLeido.match(/vender=(\d+)/) || textoLeido.match(/(\d{6,})/);
      if (m) venderId = m[1];
    }
    if (!venderId) {
      mostrarAviso("Ese código no es de un producto.", "error");
      return;
    }
    const prod = products.find((p) => p.shopifyVariantId && p.shopifyVariantId.split("/").pop() === venderId);
    setShowScanner(false);
    if (prod) {
      setTab("inventario");
      setSellTarget(prod);
    } else {
      mostrarAviso("No encontré ese producto en el inventario.", "error");
    }
  }

  // Envía una venta o cancelación al registro seguro (Google Sheets) sin bloquear
  // la app: si falla, la venta igual queda guardada en el teléfono.
  function enviarAlRegistro(evento) {
    try {
      fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evento),
      }).catch(() => {});
    } catch (err) {}
  }

  // Guarda o quita una venta del cajón COMPARTIDO en Shopify, para que todos los
  // aparatos de la clínica vean el mismo reporte. Best-effort: si falla (sin
  // conexión), la venta igual queda en el teléfono y se reintenta al recargar.
  function guardarVentaCompartida(accion, datos) {
    try {
      fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, ...datos }),
      }).catch(() => {});
    } catch (err) {}
  }

  // Al abrir la app, trae las ventas de la semana desde el cajón compartido y las
  // combina con las que haya en este teléfono (por si alguna se hizo sin
  // conexión). Las que solo están aquí, las sube al cajón compartido.
  function cargarVentasCompartidas() {
    fetch("/api/ventas")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !Array.isArray(data.ventas)) return;
        setSales((locales) => {
          const idsRemotos = new Set(data.ventas.map((v) => v.id));
          const soloLocales = locales.filter((v) => !idsRemotos.has(v.id));
          // Sube al cajón compartido las ventas que solo existían en este aparato.
          soloLocales.forEach((v) => guardarVentaCompartida("agregar", { venta: v }));
          const combinadas = [...data.ventas, ...soloLocales];
          combinadas.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
          return combinadas;
        });
      })
      .catch(() => {});
  }

  const filtered = products.filter((p) => p.nombre.toLowerCase().includes(query.toLowerCase()));

  function handleAddProduct(form) {
    setProducts((prev) => [...prev, {
      id: Date.now(), nombre: form.nombre, tipo: form.tipo, precio: Number(form.precio),
      metodoPago: form.metodoPago, stock: form.tipo === "producto" ? Number(form.stock) : null, foto: form.foto || null,
    }]);
    setShowAdd(false);
  }

  function handleEditProduct(form) {
    setProducts((prev) => prev.map((p) => p.id === editTarget.id ? {
      ...p, nombre: form.nombre, tipo: form.tipo, precio: Number(form.precio),
      metodoPago: form.metodoPago, stock: form.tipo === "producto" ? Number(form.stock) : null, foto: form.foto || p.foto,
    } : p));
    setEditTarget(null);
  }

  async function handleSell(form) {
    const cantidad = Number(form.cantidad) || 1;
    const producto = sellTarget;
    // Precio de esta venta: puede editarse a mano (precio especial). Si queda
    // vacío, usamos el precio normal del producto. El inventario se descuenta
    // igual, sin importar el precio.
    const precio = form.precio !== "" && form.precio != null ? Number(form.precio) : producto.precio;
    const vendedor = (form.vendedor || "").trim();
    // Recordamos quién atendió, para no volver a escribirlo cada vez.
    try { if (vendedor) localStorage.setItem("vendedor_clinica", vendedor); } catch (err) {}

    const venta = {
      id: Date.now(), productoId: producto.id, nombre: producto.nombre, cantidad,
      precio, metodoPago: form.metodoPago, canal: "Presencial", fecha: new Date().toISOString(), vendedor,
      // Guardamos el tipo y los ids de Shopify para poder devolver el stock si se cancela.
      tipo: producto.tipo, shopifyVariantId: producto.shopifyVariantId || null, inventoryItemId: producto.inventoryItemId || null,
    };
    setSales((prev) => [venta, ...prev]);
    // Manda la venta al registro seguro (Google Sheets, historial permanente).
    enviarAlRegistro({ accion: "venta", ...venta, total: precio * cantidad });
    // Y al cajón compartido en Shopify, para que todos los aparatos la vean.
    guardarVentaCompartida("agregar", { venta });

    let nuevoStock = null;
    let shopifyResultado = null;

    if (producto.tipo === "producto") {
      nuevoStock = Math.max(0, producto.stock - cantidad);
      // 1. Actualiza primero en la app, para que se vea al instante sin esperar a Shopify
      setProducts((prev) => prev.map((p) => p.id === producto.id ? { ...p, stock: nuevoStock } : p));

      // 2. Intenta descontar el mismo stock en Shopify (ubicación Clínica)
      if (producto.shopifyVariantId) {
        shopifyResultado = await descontarStockEnShopify(producto.shopifyVariantId, cantidad);
        // Shopify devuelve el stock real después de restar — lo usamos por si
        // otra persona movió inventario al mismo tiempo.
        if (shopifyResultado?.ok && shopifyResultado.stockNuevo != null) {
          nuevoStock = shopifyResultado.stockNuevo;
          setProducts((prev) => prev.map((p) => p.id === producto.id ? { ...p, stock: shopifyResultado.stockNuevo } : p));
        }
      }
    }

    setSellTarget(null);
    setConfirmacionStock({
      nombre: producto.nombre,
      tipo: producto.tipo,
      stock: nuevoStock,
      cantidad,
      total: precio * cantidad,
      shopifyOk: shopifyResultado ? shopifyResultado.ok : null,
      shopifyError: shopifyResultado && !shopifyResultado.ok ? shopifyResultado.error : null,
    });
    setTimeout(() => setConfirmacionStock(null), 4000);
  }

  // Cancela una venta: la quita del registro y, si era un producto, devuelve la
  // cantidad al stock en Shopify (para que el inventario quede correcto).
  async function handleCancelarVenta(venta) {
    const total = venta.precio * venta.cantidad;
    if (!window.confirm(`¿Cancelar esta venta?\n${venta.cantidad} × ${venta.nombre} — Q${total}`)) return;

    setSales((prev) => prev.filter((s) => s.id !== venta.id));
    // Deja constancia de la cancelación en el registro seguro (Google Sheets).
    enviarAlRegistro({ accion: "cancelacion", ...venta, total });
    // Quita la venta del cajón compartido en Shopify (todos los aparatos).
    guardarVentaCompartida("cancelar", { id: venta.id });

    if (venta.tipo === "producto" && (venta.inventoryItemId || venta.shopifyVariantId)) {
      try {
        const response = await fetch("/api/ajustar-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inventoryItemId: venta.inventoryItemId,
            variantId: venta.shopifyVariantId,
            delta: venta.cantidad,
            motivo: "cancelacion",
          }),
        });
        const r = await response.json();
        if (r.ok) {
          if (r.stockNuevo != null) {
            setProducts((prev) => prev.map((p) => (p.shopifyVariantId === venta.shopifyVariantId ? { ...p, stock: r.stockNuevo } : p)));
          }
          mostrarAviso(`Venta cancelada. Se devolvieron ${venta.cantidad} al stock de ${venta.nombre}.`);
        } else {
          mostrarAviso(`Venta cancelada, pero no se pudo devolver el stock: ${r.error}`, "error");
        }
      } catch (err) {
        mostrarAviso("Venta cancelada. No se pudo conectar para devolver el stock.", "error");
      }
    } else {
      mostrarAviso("Venta cancelada.");
    }
  }

  // ---------- Pedidos (reabastecimiento) ----------
  function actualizarPedidoLocal(productoId, pedido) {
    setProducts((prev) => prev.map((p) => (p.id === productoId ? { ...p, pedido } : p)));
  }

  async function llamarApiPedido(producto, accion, cantidad, hastaFecha) {
    try {
      const response = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: producto.shopifyProductId, accion, cantidad, hastaFecha }),
      });
      return await response.json();
    } catch (err) {
      return { ok: false, error: "No se pudo conectar con el servidor." };
    }
  }

  // Alguien marca a mano un producto como "hay que pedirlo".
  async function marcarPorPedir(producto) {
    const anterior = producto.pedido || null;
    actualizarPedidoLocal(producto.id, { estado: "por_pedir", fecha: new Date().toISOString() });
    const r = await llamarApiPedido(producto, "por_pedir");
    if (!r.ok) {
      actualizarPedidoLocal(producto.id, anterior);
      mostrarAviso(`No se pudo guardar: ${r.error}`, "error");
    }
  }

  // Quita un producto de la lista de pedidos (o cancela un pedido anotado).
  async function quitarDePedidos(producto) {
    const anterior = producto.pedido || null;
    actualizarPedidoLocal(producto.id, null);
    const r = await llamarApiPedido(producto, "quitar");
    if (!r.ok) {
      actualizarPedidoLocal(producto.id, anterior);
      mostrarAviso(`No se pudo quitar: ${r.error}`, "error");
    }
  }

  // Esconde un producto de "Por pedir" aunque tenga stock bajo (p. ej. algo que
  // ya no se va a volver a pedir). Se puede regresar buscándolo abajo.
  async function descartarDePedidos(producto) {
    const anterior = producto.pedido || null;
    actualizarPedidoLocal(producto.id, { estado: "descartado", fecha: new Date().toISOString() });
    const r = await llamarApiPedido(producto, "descartado");
    if (r.ok) {
      mostrarAviso(`${producto.nombre} se quitó de la lista. Puedes regresarlo buscándolo abajo.`);
    } else {
      actualizarPedidoLocal(producto.id, anterior);
      mostrarAviso(`No se pudo quitar: ${r.error}`, "error");
    }
  }

  // El proveedor no tiene el producto: queda en "back order" con fecha estimada
  // de regreso, o sin fecha ("hasta confirmación").
  async function handleBackorder(form) {
    const producto = backorderTarget;
    setBackorderTarget(null);
    const anterior = producto.pedido || null;
    const hastaFecha = form.hastaFecha || null;
    actualizarPedidoLocal(producto.id, { estado: "backorder", hastaFecha, fecha: new Date().toISOString() });
    const r = await llamarApiPedido(producto, "backorder", null, hastaFecha);
    if (r.ok) {
      mostrarAviso(hastaFecha
        ? `${producto.nombre}: agotado con proveedor, regresa ${formatearFecha(hastaFecha)}.`
        : `${producto.nombre}: agotado con proveedor hasta confirmación.`);
    } else {
      actualizarPedidoLocal(producto.id, anterior);
      mostrarAviso(`No se pudo guardar: ${r.error}`, "error");
    }
  }

  // Se anotó un pedido al proveedor, con la cantidad ordenada.
  async function handleMarcarPedido(form) {
    const producto = pedidoTarget;
    const cantidad = Number(form.cantidad);
    setPedidoTarget(null);
    const anterior = producto.pedido || null;
    actualizarPedidoLocal(producto.id, { estado: "pedido", cantidad, fecha: new Date().toISOString() });
    const r = await llamarApiPedido(producto, "pedido", cantidad);
    if (r.ok) {
      mostrarAviso(`Pedido anotado: ${cantidad} × ${producto.nombre}. Todo el equipo lo ve.`);
    } else {
      actualizarPedidoLocal(producto.id, anterior);
      mostrarAviso(`No se pudo guardar el pedido: ${r.error}`, "error");
    }
  }

  // Llegó el pedido: la cantidad recibida se SUMA sola al stock en Shopify.
  async function handleRecibir(form) {
    const producto = recibirTarget;
    const cantidad = Number(form.cantidad);
    setRecibirTarget(null);
    try {
      const response = await fetch("/api/ajustar-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: producto.shopifyProductId,
          inventoryItemId: producto.inventoryItemId,
          variantId: producto.shopifyVariantId,
          delta: cantidad,
          motivo: "recibido",
        }),
      });
      const r = await response.json();
      if (r.ok) {
        const stockNuevo = r.stockNuevo != null ? r.stockNuevo : producto.stock + cantidad;
        setProducts((prev) => prev.map((p) => (p.id === producto.id ? { ...p, stock: stockNuevo, pedido: null } : p)));
        mostrarAviso(`Recibido: +${cantidad} ${producto.nombre}. Stock en Shopify: ${stockNuevo}.`);
      } else {
        mostrarAviso(`No se sumó en Shopify: ${r.error}`, "error");
      }
    } catch (err) {
      mostrarAviso("No se pudo conectar con el servidor. Intenta de nuevo.", "error");
    }
  }

  const totalVentas = sales.reduce((sum, s) => sum + s.precio * s.cantidad, 0);
  const stockBajo = products.filter((p) => p.tipo === "producto" && p.stock <= 3).length;

  // Listas para la pestaña "Pedidos": lo que está bajo el umbral (o marcado a
  // mano), lo que ya se ordenó y está en camino, y lo agotado con el proveedor.
  // Los "descartado" no aparecen en ninguna lista aunque tengan stock bajo.
  const productosFisicos = products.filter((p) => p.tipo === "producto");
  const pedidosEnCamino = productosFisicos.filter((p) => p.pedido?.estado === "pedido");
  const backOrders = productosFisicos.filter((p) => p.pedido?.estado === "backorder");
  const porPedir = productosFisicos.filter(
    (p) => !["pedido", "backorder", "descartado"].includes(p.pedido?.estado) &&
      (p.stock < UMBRAL_PEDIDO || p.pedido?.estado === "por_pedir")
  );
  const pendientes = porPedir.length + pedidosEnCamino.length;

  // Reporte agrupado por día
  const porDia = sales.reduce((acc, s) => {
    const dia = new Date(s.fecha).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(s);
    return acc;
  }, {});

  const totalPresencial = sales.filter((s) => s.canal === "Presencial").reduce((s2, v) => s2 + v.precio * v.cantidad, 0);
  const totalEnLinea = sales.filter((s) => s.canal === "En línea").reduce((s2, v) => s2 + v.precio * v.cantidad, 0);

  // Reporte agrupado por persona que atendió (para ver el total a cobrar de cada
  // quien). Las ventas sin nombre se juntan bajo "Sin nombre".
  const porPersona = sales.reduce((acc, s) => {
    const persona = (s.vendedor || "").trim() || "Sin nombre";
    if (!acc[persona]) acc[persona] = [];
    acc[persona].push(s);
    return acc;
  }, {});
  // Ordenamos las personas de mayor a menor total a cobrar.
  const personasOrdenadas = Object.entries(porPersona).sort(
    (a, b) =>
      b[1].reduce((s, v) => s + v.precio * v.cantidad, 0) -
      a[1].reduce((s, v) => s + v.precio * v.cantidad, 0)
  );

  return (
    <div className="min-h-screen bg-[#F7F4EC] font-sans text-[#2F4A33]">
      <header className="px-5 pt-6 pb-4 border-b border-[#E4DFCE] bg-[#F7F4EC] sticky top-0 z-10">
        <p className="text-xs tracking-widest text-[#6B4E71] font-semibold uppercase">Dra. Mariale Rivers</p>
        <h1 className="font-serif text-2xl font-bold mt-1">Inventario · Clínica</h1>
        <div className="flex gap-4 mt-3 text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#4B6B4F]" />
            <span className="text-[#2F4A33]">Q{totalVentas} en ventas</span>
          </div>
          {stockBajo > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-[#A6402F]" />
              <span className="text-[#A6402F]">{stockBajo} con stock bajo</span>
            </div>
          )}
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#4B6B4F] text-white px-3 py-1.5 rounded-full shadow-sm hover:bg-[#3A5540] transition ml-auto"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Escanear</span>
          </button>
          <button
            onClick={() => setShopifySynced((s) => !s)}
            className="flex items-center gap-1.5 text-xs bg-white border border-[#E4DFCE] px-2.5 py-1 rounded-full"
          >
            <Link2 className="w-3.5 h-3.5 text-[#6B4E71]" />
            <span className={shopifySynced ? "text-[#4B6B4F]" : "text-[#8A8368]"}>
              {shopifySynced ? "Shopify conectado" : "Shopify no conectado"}
            </span>
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-1.5 text-xs bg-white border border-[#E4DFCE] px-2.5 py-1 rounded-full"
          >
            <QrCode className="w-3.5 h-3.5 text-[#6B4E71]" />
            <span className="text-[#2F4A33]">Códigos QR</span>
          </button>
        </div>
      </header>

      <div className="flex flex-wrap px-5 gap-2 mt-4">
        <button onClick={() => setTab("inventario")} className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition ${tab === "inventario" ? "bg-[#4B6B4F] text-white" : "bg-white text-[#2F4A33] border border-[#E4DFCE]"}`}>
          <Package className="w-4 h-4" /> Inventario
        </button>
        <button onClick={() => setTab("pedidos")} className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition ${tab === "pedidos" ? "bg-[#4B6B4F] text-white" : "bg-white text-[#2F4A33] border border-[#E4DFCE]"}`}>
          <ShoppingCart className="w-4 h-4" /> Pedidos
          {pendientes > 0 && (
            <span className={`text-xs font-bold rounded-full px-1.5 min-w-[1.25rem] text-center ${tab === "pedidos" ? "bg-white/25 text-white" : "bg-[#A6402F] text-white"}`}>
              {pendientes}
            </span>
          )}
        </button>
        <button onClick={() => setTab("ventas")} className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition ${tab === "ventas" ? "bg-[#4B6B4F] text-white" : "bg-white text-[#2F4A33] border border-[#E4DFCE]"}`}>
          <Receipt className="w-4 h-4" /> Ventas
        </button>
        <button onClick={() => setTab("reporte")} className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition ${tab === "reporte" ? "bg-[#4B6B4F] text-white" : "bg-white text-[#2F4A33] border border-[#E4DFCE]"}`}>
          <Calendar className="w-4 h-4" /> Reporte
        </button>
      </div>

      <main className="px-5 py-4 pb-24">
        {tab === "inventario" && (
          <>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8A8368] absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto o servicio..."
                  className="w-full bg-white border border-[#E4DFCE] rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder:text-[#8A8368] focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30" />
              </div>
              <button onClick={() => setShowResumen(true)}
                className="flex items-center gap-1.5 bg-white border border-[#E4DFCE] px-3 py-2.5 rounded-xl text-sm text-[#2F4A33] hover:bg-[#F0EDE1] transition shrink-0">
                <ListChecks className="w-4 h-4 text-[#4B6B4F]" />
                Ver todo
              </button>
            </div>
            <div className="space-y-3">
              {cargandoProductos && <p className="text-sm text-[#8A8368] text-center py-8">Cargando productos de Shopify...</p>}
              {!cargandoProductos && filtered.length === 0 && <p className="text-sm text-[#8A8368] text-center py-8">No hay nada que coincida.</p>}
              {filtered.map((p) => <ProductCard key={p.id} p={p} onSell={setSellTarget} onEdit={setEditTarget} />)}
            </div>
          </>
        )}

        {tab === "pedidos" && (
          <PedidosTab
            porPedir={porPedir}
            enCamino={pedidosEnCamino}
            backOrders={backOrders}
            productos={productosFisicos}
            cargando={cargandoProductos}
            onRefrescar={cargarProductos}
            onMarcarPorPedir={marcarPorPedir}
            onQuitar={quitarDePedidos}
            onDescartar={descartarDePedidos}
            onAbrirPedido={setPedidoTarget}
            onAbrirRecibir={setRecibirTarget}
            onAbrirBackorder={setBackorderTarget}
          />
        )}

        {tab === "ventas" && (
          <div className="space-y-3">
            {sales.length === 0 && <p className="text-sm text-[#8A8368] text-center py-8">Todavía no has registrado ninguna venta.</p>}
            {sales.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-[#E4DFCE] p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{s.nombre}</p>
                    <Badge tone={s.canal === "En línea" ? "servicio" : "ok"}>{s.canal}</Badge>
                  </div>
                  <p className="text-xs text-[#8A8368] mt-0.5 flex items-center gap-1">
                    <MetodoIcon metodo={s.metodoPago} className="w-3.5 h-3.5" />
                    {s.cantidad} × Q{s.precio} · {s.metodoPago}{s.vendedor ? ` · ${s.vendedor}` : ""}
                  </p>
                  <p className="text-xs text-[#8A8368]">
                    {new Date(s.fecha).toLocaleDateString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-serif font-bold text-[#4B6B4F]">Q{s.precio * s.cantidad}</span>
                  <button onClick={() => handleCancelarVenta(s)} className="flex items-center gap-1 text-xs text-[#A6402F] hover:underline">
                    <X className="w-3 h-3" /> Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "reporte" && (
          <div className="space-y-5">
            {sales.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-[#E4DFCE] p-3">
                  <p className="text-xs text-[#8A8368]">Presencial</p>
                  <p className="font-serif font-bold text-lg text-[#4B6B4F]">Q{totalPresencial}</p>
                </div>
                <div className="bg-white rounded-xl border border-[#E4DFCE] p-3">
                  <p className="text-xs text-[#8A8368]">En línea (Shopify)</p>
                  <p className="font-serif font-bold text-lg text-[#6B4E71]">Q{totalEnLinea}</p>
                </div>
              </div>
            )}

            {/* Selector de vista: por día o por persona */}
            {sales.length > 0 && (
              <div className="flex gap-2">
                <button onClick={() => setReporteVista("dia")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg border transition ${reporteVista === "dia" ? "bg-[#4B6B4F] text-white border-[#4B6B4F]" : "bg-white text-[#2F4A33] border-[#E4DFCE]"}`}>
                  <Calendar className="w-4 h-4" /> Por día
                </button>
                <button onClick={() => setReporteVista("persona")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg border transition ${reporteVista === "persona" ? "bg-[#4B6B4F] text-white border-[#4B6B4F]" : "bg-white text-[#2F4A33] border-[#E4DFCE]"}`}>
                  <Users className="w-4 h-4" /> Por persona
                </button>
              </div>
            )}

            {sales.length === 0 && <p className="text-sm text-[#8A8368] text-center py-8">Aún no hay ventas para reportar.</p>}

            {/* Vista por día */}
            {reporteVista === "dia" && Object.entries(porDia).map(([dia, ventasDia]) => {
              const totalDia = ventasDia.reduce((s, v) => s + v.precio * v.cantidad, 0);
              return (
                <div key={dia} className="bg-white rounded-2xl border border-[#E4DFCE] p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-serif font-bold text-[#2F4A33]">{dia}</h3>
                    <span className="font-bold text-[#4B6B4F]">Q{totalDia}</span>
                  </div>
                  <div className="divide-y divide-[#E4DFCE]">
                    {ventasDia.map((v) => (
                      <div key={v.id} className="flex justify-between py-1.5 text-sm">
                        <span className="text-[#2F4A33]">
                          {new Date(v.fecha).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })} · {v.nombre}
                          <span className={`ml-2 text-xs ${v.canal === "En línea" ? "text-[#6B4E71]" : "text-[#4B6B4F]"}`}>({v.canal})</span>
                        </span>
                        <span className="text-[#8A8368]">{v.cantidad} × Q{v.precio} · {v.metodoPago}{v.vendedor ? ` · ${v.vendedor}` : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Vista por persona: total a cobrar de cada quien */}
            {reporteVista === "persona" && personasOrdenadas.map(([persona, ventasPersona]) => {
              const totalPersona = ventasPersona.reduce((s, v) => s + v.precio * v.cantidad, 0);
              const unidades = ventasPersona.reduce((s, v) => s + v.cantidad, 0);
              return (
                <div key={persona} className="bg-white rounded-2xl border border-[#E4DFCE] p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-[#F0EDE1] flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-[#6B4E71]" />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-[#2F4A33] leading-tight">{persona}</h3>
                        <p className="text-xs text-[#8A8368]">{ventasPersona.length} {ventasPersona.length === 1 ? "venta" : "ventas"} · {unidades} {unidades === 1 ? "unidad" : "unidades"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#8A8368]">Total a cobrar</p>
                      <span className="font-serif font-bold text-lg text-[#4B6B4F]">Q{totalPersona}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-[#E4DFCE]">
                    {ventasPersona.map((v) => (
                      <div key={v.id} className="flex justify-between py-1.5 text-sm">
                        <span className="text-[#2F4A33]">
                          {new Date(v.fecha).toLocaleDateString("es-GT", { day: "numeric", month: "short" })} · {v.nombre}
                        </span>
                        <span className="text-[#8A8368]">{v.cantidad} × Q{v.precio} · {v.metodoPago}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {confirmacionStock && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2F4A33] text-white rounded-xl shadow-lg px-4 py-3 text-sm max-w-xs">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#C89B3C] shrink-0" />
            <span>
              Venta registrada: {confirmacionStock.cantidad} × {confirmacionStock.nombre}.{" "}
              {confirmacionStock.tipo === "producto"
                ? <strong>Stock restante: {confirmacionStock.stock}</strong>
                : <strong>Total: Q{confirmacionStock.total}</strong>}
            </span>
          </div>
          {confirmacionStock.shopifyOk === true && (
            <p className="text-xs text-[#A8C4A2] mt-1 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Sincronizado con Shopify
            </p>
          )}
          {confirmacionStock.shopifyOk === false && (
            <p className="text-xs text-[#E8B98A] mt-1">
              ⚠ No se sincronizó con Shopify aún ({confirmacionStock.shopifyError}). La venta quedó guardada aquí.
            </p>
          )}
        </div>
      )}

      {aviso && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-xl shadow-lg px-4 py-3 text-sm max-w-xs text-white ${aviso.tono === "error" ? "bg-[#A6402F]" : "bg-[#2F4A33]"}`}>
          {aviso.texto}
        </div>
      )}

      {tab === "inventario" && (
        <button onClick={() => setShowAdd(true)} className="fixed bottom-6 right-6 bg-[#4B6B4F] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-[#3A5540] transition">
          <Plus className="w-6 h-6" />
        </button>
      )}

      {showAdd && <ProductForm title="Nuevo producto o servicio" onClose={() => setShowAdd(false)} onSubmit={handleAddProduct} />}
      {editTarget && <ProductForm title="Editar" initial={editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEditProduct} />}
      {sellTarget && <SellForm target={sellTarget} onClose={() => setSellTarget(null)} onSubmit={handleSell} />}
      {showResumen && <ResumenInventario products={products} onClose={() => setShowResumen(false)} />}
      {showQR && <HojaQR products={products} onClose={() => setShowQR(false)} />}
      {showScanner && <ScannerModal onScan={handleScan} onClose={() => setShowScanner(false)} />}
      {pedidoTarget && <PedidoForm target={pedidoTarget} onClose={() => setPedidoTarget(null)} onSubmit={handleMarcarPedido} />}
      {recibirTarget && <RecibirForm target={recibirTarget} onClose={() => setRecibirTarget(null)} onSubmit={handleRecibir} />}
      {backorderTarget && <BackorderForm target={backorderTarget} onClose={() => setBackorderTarget(null)} onSubmit={handleBackorder} />}
    </div>
  );
}

function ResumenInventario({ products, onClose }) {
  const productos = products.filter((p) => p.tipo === "producto");
  const servicios = products.filter((p) => p.tipo === "servicio");
  const totalUnidades = productos.reduce((sum, p) => sum + (p.stock || 0), 0);

  return (
    <Modal title="Inventario completo" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-xl border border-[#E4DFCE] p-3">
            <p className="text-xs text-[#8A8368]">Productos</p>
            <p className="font-serif font-bold text-lg text-[#4B6B4F]">{productos.length}</p>
          </div>
          <div className="flex-1 bg-white rounded-xl border border-[#E4DFCE] p-3">
            <p className="text-xs text-[#8A8368]">Unidades totales</p>
            <p className="font-serif font-bold text-lg text-[#4B6B4F]">{totalUnidades}</p>
          </div>
          <div className="flex-1 bg-white rounded-xl border border-[#E4DFCE] p-3">
            <p className="text-xs text-[#8A8368]">Servicios</p>
            <p className="font-serif font-bold text-lg text-[#6B4E71]">{servicios.length}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-[#2F4A33] mb-2 uppercase tracking-wide">Productos</p>
          <div className="bg-white rounded-xl border border-[#E4DFCE] divide-y divide-[#E4DFCE]">
            {productos.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-[#2F4A33] truncate pr-2">{p.nombre}</span>
                <span className={`font-medium shrink-0 ${p.stock <= 3 ? "text-[#A6402F]" : "text-[#4B6B4F]"}`}>
                  {p.stock} en stock
                </span>
              </div>
            ))}
            {productos.length === 0 && <p className="text-xs text-[#8A8368] px-3 py-3">Sin productos aún.</p>}
          </div>
        </div>

        {servicios.length > 0 && (
          <div>
            <p className="text-xs font-medium text-[#2F4A33] mb-2 uppercase tracking-wide">Servicios</p>
            <div className="bg-white rounded-xl border border-[#E4DFCE] divide-y divide-[#E4DFCE]">
              {servicios.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-[#2F4A33] truncate pr-2">{s.nombre}</span>
                  <span className="font-medium text-[#6B4E71] shrink-0">Q{s.precio}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function FotoMini({ p }) {
  return (
    <div className="w-11 h-11 rounded-lg bg-[#F7F4EC] border border-[#E4DFCE] flex items-center justify-center overflow-hidden shrink-0">
      {p.foto ? <img src={p.foto} alt={p.nombre} className="w-full h-full object-cover" /> : <Camera className="w-4 h-4 text-[#4B6B4F]/40" />}
    </div>
  );
}

function formatearFecha(iso) {
  if (!iso) return "";
  // Las fechas "solo día" (2026-09-15) se interpretan a mediodía para que no
  // se corran un día hacia atrás por la zona horaria de Guatemala.
  const valor = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso;
  const fecha = new Date(valor);
  const opciones = { day: "numeric", month: "short" };
  if (fecha.getFullYear() !== new Date().getFullYear()) opciones.year = "numeric";
  return fecha.toLocaleDateString("es-GT", opciones);
}

// Pestaña de reabastecimiento. La lista "Por pedir" se arma SOLA con los productos
// bajo el umbral — nadie tiene que revisar el inventario a mano. El flujo es:
// Por pedir → "Ya lo pedí" (con cantidad) → En camino → "Llegó" → la cantidad
// recibida se SUMA automáticamente al stock en Shopify.
function PedidosTab({ porPedir, enCamino, backOrders, productos, cargando, onRefrescar, onMarcarPorPedir, onQuitar, onDescartar, onAbrirPedido, onAbrirRecibir, onAbrirBackorder }) {
  const [busca, setBusca] = useState("");

  const yaListados = new Set([...porPedir, ...enCamino, ...backOrders].map((p) => p.id));
  const candidatos = busca.trim()
    ? productos.filter((p) => !yaListados.has(p.id) && p.nombre.toLowerCase().includes(busca.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[#8A8368]">
          Los productos con menos de {UMBRAL_PEDIDO} unidades entran solos a "Por pedir".
        </p>
        <button onClick={onRefrescar} className="flex items-center gap-1.5 text-xs bg-white border border-[#E4DFCE] px-2.5 py-1.5 rounded-full text-[#2F4A33] shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>

      <section>
        <h3 className="flex items-center gap-2 font-serif font-bold text-[#A6402F] mb-2">
          <ClipboardList className="w-4 h-4" /> Por pedir ({porPedir.length})
        </h3>
        {porPedir.length === 0 && (
          <p className="text-sm text-[#8A8368] bg-white border border-[#E4DFCE] rounded-xl px-3 py-3">Nada por pedir — todo tiene stock suficiente ✓</p>
        )}
        <div className="space-y-2">
          {porPedir.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-[#E4DFCE] p-3 flex items-center gap-3">
              <FotoMini p={p} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#2F4A33] truncate">{p.nombre}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge tone="low">Quedan {p.stock}</Badge>
                  {p.pedido?.estado === "por_pedir" && <Badge>Marcado a mano</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onAbrirPedido(p)} className="text-xs font-medium bg-[#C89B3C] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition">
                  Ya lo pedí
                </button>
                <button onClick={() => onAbrirBackorder(p)} className="text-[#6B4E71] border border-[#6B4E71]/30 p-1.5 rounded-lg hover:bg-[#6B4E71]/5 transition" title="Agotado con proveedor (back order)">
                  <Hourglass className="w-4 h-4" />
                </button>
                <button onClick={() => onDescartar(p)} className="text-[#8A8368] p-1.5 hover:text-[#A6402F]" title="Quitar de la lista">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="flex items-center gap-2 font-serif font-bold text-[#7A5B14] mb-2">
          <Truck className="w-4 h-4" /> En camino ({enCamino.length})
        </h3>
        {enCamino.length === 0 && (
          <p className="text-sm text-[#8A8368] bg-white border border-[#E4DFCE] rounded-xl px-3 py-3">Ningún pedido en camino.</p>
        )}
        <div className="space-y-2">
          {enCamino.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-[#E4DFCE] p-3 flex items-center gap-3">
              <FotoMini p={p} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#2F4A33] truncate">{p.nombre}</p>
                <p className="text-xs text-[#8A8368] mt-0.5">
                  Pedidas: {p.pedido?.cantidad ?? "?"}{p.pedido?.fecha ? ` · ${formatearFecha(p.pedido.fecha)}` : ""} · stock {p.stock}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onAbrirRecibir(p)} className="flex items-center gap-1 text-xs font-medium bg-[#4B6B4F] text-white px-3 py-1.5 rounded-lg hover:bg-[#3A5540] transition">
                  <PackageCheck className="w-3.5 h-3.5" /> Llegó
                </button>
                <button onClick={() => onQuitar(p)} className="text-[#8A8368] p-1.5 hover:text-[#A6402F]" title="Cancelar pedido">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="flex items-center gap-2 font-serif font-bold text-[#6B4E71] mb-2">
          <Hourglass className="w-4 h-4" /> Agotado con proveedor ({backOrders.length})
        </h3>
        {backOrders.length === 0 && (
          <p className="text-sm text-[#8A8368] bg-white border border-[#E4DFCE] rounded-xl px-3 py-3">Nada en back order.</p>
        )}
        <div className="space-y-2">
          {backOrders.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-[#E4DFCE] p-3 flex items-center gap-3">
              <FotoMini p={p} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#2F4A33] truncate">{p.nombre}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge tone="servicio">
                    {p.pedido?.hastaFecha ? `Regresa: ${formatearFecha(p.pedido.hastaFecha)}` : "Hasta confirmación"}
                  </Badge>
                  <span className="text-xs text-[#8A8368]">stock {p.stock}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onAbrirPedido(p)} className="text-xs font-medium bg-[#C89B3C] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition">
                  Ya lo pedí
                </button>
                <button onClick={() => onQuitar(p)} className="text-[#8A8368] p-1.5 hover:text-[#A6402F]" title="Quitar de back order">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-serif font-bold text-[#2F4A33] mb-2">¿Falta algo más?</h3>
        <div className="relative">
          <Search className="w-4 h-4 text-[#8A8368] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar producto para agregarlo a la lista..."
            className="w-full bg-white border border-[#E4DFCE] rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder:text-[#8A8368] focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30" />
        </div>
        {candidatos.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E4DFCE] divide-y divide-[#E4DFCE] mt-2">
            {candidatos.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                <FotoMini p={p} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#2F4A33] truncate">{p.nombre}</p>
                  <p className="text-xs text-[#8A8368]">Stock: {p.stock}</p>
                </div>
                <button onClick={() => { onMarcarPorPedir(p); setBusca(""); }}
                  className="text-xs font-medium border border-[#4B6B4F] text-[#4B6B4F] px-3 py-1.5 rounded-lg hover:bg-[#4B6B4F]/5 transition shrink-0">
                  + Por pedir
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// El proveedor no tiene el producto: se anota cuándo regresa (o sin fecha,
// "hasta confirmación") para que nadie lo siga intentando pedir.
function BackorderForm({ target, onClose, onSubmit }) {
  const [hastaFecha, setHastaFecha] = useState(target.pedido?.hastaFecha || "");
  return (
    <Modal title={`Agotado con proveedor: ${target.nombre}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-[#8A8368]">
          El producto pasa a la sección "Back order" y sale de "Por pedir". Anota la fecha en que el proveedor dice que regresa, o guárdalo sin fecha.
        </p>
        <label className="block">
          <span className="text-xs font-medium text-[#2F4A33]">Fecha estimada de regreso</span>
          <input type="date" value={hastaFecha} onChange={(e) => setHastaFecha(e.target.value)}
            className="w-full mt-1 bg-white border border-[#E4DFCE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30" />
        </label>
        <button onClick={() => onSubmit({ hastaFecha })} disabled={!hastaFecha}
          className="w-full bg-[#6B4E71] text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-40">
          Guardar con fecha
        </button>
        <button onClick={() => onSubmit({ hastaFecha: null })}
          className="w-full border border-[#6B4E71] text-[#6B4E71] py-2.5 rounded-lg font-medium text-sm hover:bg-[#6B4E71]/5 transition">
          Hasta confirmación (sin fecha)
        </button>
      </div>
    </Modal>
  );
}

// La persona que ordena anota cuántas unidades pidió al proveedor.
function PedidoForm({ target, onClose, onSubmit }) {
  const [cantidad, setCantidad] = useState("");
  return (
    <Modal title={`Ya lo pedí: ${target.nombre}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-[#8A8368]">Stock actual: {target.stock}. Anota cuántas unidades ordenaste — todo el equipo verá que ya está pedido.</p>
        <label className="block">
          <span className="text-xs font-medium text-[#2F4A33]">Cantidad pedida</span>
          <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} autoFocus
            className="w-full mt-1 bg-white border border-[#E4DFCE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30" placeholder="Ej: 6" />
        </label>
        <button onClick={() => onSubmit({ cantidad })} disabled={!(Number(cantidad) > 0)}
          className="w-full bg-[#C89B3C] text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-40">
          Guardar pedido
        </button>
      </div>
    </Modal>
  );
}

// Llegó el pedido: se confirma la cantidad recibida y Shopify la SUMA al stock.
// Nadie tiene que contar el total ni escribirlo — cero errores de dedo.
function RecibirForm({ target, onClose, onSubmit }) {
  const [cantidad, setCantidad] = useState(target.pedido?.cantidad || "");
  const stockNuevo = target.stock + (Number(cantidad) || 0);
  return (
    <Modal title={`Recibir: ${target.nombre}`} onClose={onClose}>
      <div className="space-y-3">
        {target.pedido?.cantidad != null && (
          <p className="text-sm text-[#8A8368]">
            Se pidieron {target.pedido.cantidad} unidades{target.pedido.fecha ? ` el ${formatearFecha(target.pedido.fecha)}` : ""}.
          </p>
        )}
        <label className="block">
          <span className="text-xs font-medium text-[#2F4A33]">Cantidad recibida</span>
          <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} autoFocus
            className="w-full mt-1 bg-white border border-[#E4DFCE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30" />
        </label>
        <div className="bg-[#F7F4EC] rounded-lg p-3 text-sm flex justify-between">
          <span className="text-[#2F4A33]">Stock en Shopify</span>
          <span className="font-serif font-bold text-[#4B6B4F]">{target.stock} → {stockNuevo}</span>
        </div>
        <p className="text-xs text-[#8A8368]">La cantidad se suma sola al stock actual — no hay que contar ni escribir el total.</p>
        <button onClick={() => onSubmit({ cantidad })} disabled={!(Number(cantidad) > 0)}
          className="w-full bg-[#4B6B4F] text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-40">
          Confirmar recepción
        </button>
      </div>
    </Modal>
  );
}

function ProductForm({ title, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(initial || { nombre: "", tipo: "producto", precio: "", metodoPago: "Efectivo", stock: "", foto: null });

  function handleFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, foto: reader.result }));
    reader.readAsDataURL(file);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-[#2F4A33]">Foto</span>
          <div className="mt-1 w-full h-32 rounded-xl border border-dashed border-[#E4DFCE] bg-white flex items-center justify-center overflow-hidden">
            {form.foto ? <img src={form.foto} className="w-full h-full object-cover" /> : (
              <div className="flex flex-col items-center text-[#8A8368]">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-xs">Toca para subir foto</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFoto} className="hidden" id="foto-input" />
          </div>
          <label htmlFor="foto-input" className="text-xs text-[#6B4E71] font-medium block mt-1 cursor-pointer">
            {form.foto ? "Cambiar foto" : "Subir foto"}
          </label>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-[#2F4A33]">Nombre</span>
          <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="w-full mt-1 bg-white border border-[#E4DFCE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30"
            placeholder="Ej: Ghee, Consulta de Ayurveda..." />
        </label>

        <div className="flex gap-2">
          <button onClick={() => setForm((f) => ({ ...f, tipo: "producto" }))}
            className={`flex-1 text-sm py-2 rounded-lg border transition ${form.tipo === "producto" ? "bg-[#4B6B4F] text-white border-[#4B6B4F]" : "border-[#E4DFCE] text-[#2F4A33]"}`}>
            Producto
          </button>
          <button onClick={() => setForm((f) => ({ ...f, tipo: "servicio" }))}
            className={`flex-1 text-sm py-2 rounded-lg border transition ${form.tipo === "servicio" ? "bg-[#6B4E71] text-white border-[#6B4E71]" : "border-[#E4DFCE] text-[#2F4A33]"}`}>
            Servicio
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-[#2F4A33]">Precio (Q)</span>
          <input type="number" value={form.precio} onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
            className="w-full mt-1 bg-white border border-[#E4DFCE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30" placeholder="0" />
        </label>

        {form.tipo === "producto" && (
          <label className="block">
            <span className="text-xs font-medium text-[#2F4A33]">Cantidad en stock</span>
            <input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              className="w-full mt-1 bg-white border border-[#E4DFCE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30" placeholder="0" />
          </label>
        )}

        <label className="block">
          <span className="text-xs font-medium text-[#2F4A33]">Método de pago habitual</span>
          <div className="flex gap-2 mt-1">
            {metodosPago.map(({ key, icon: Icon }) => (
              <button key={key} onClick={() => setForm((f) => ({ ...f, metodoPago: key }))}
                className={`flex-1 flex flex-col items-center gap-1 text-xs py-2 rounded-lg border transition ${form.metodoPago === key ? "bg-[#4B6B4F] text-white border-[#4B6B4F]" : "border-[#E4DFCE] text-[#2F4A33]"}`}>
                <Icon className="w-4 h-4" />
                {key}
              </button>
            ))}
          </div>
        </label>

        <button onClick={() => onSubmit(form)} disabled={!form.nombre || !form.precio}
          className="w-full bg-[#4B6B4F] text-white py-2.5 rounded-lg font-medium text-sm mt-2 disabled:opacity-40">
          Guardar
        </button>
      </div>
    </Modal>
  );
}

// Hoja imprimible de códigos QR: uno por producto. Al escanear un QR con la
// cámara del celular, se abre la app directo en "Registrar venta" de ese producto.
function HojaQR({ products, onClose }) {
  const productos = products.filter((p) => p.tipo === "producto" && p.shopifyVariantId);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <div className="qr-overlay fixed inset-0 bg-white z-50 overflow-y-auto">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .qr-hoja, .qr-hoja * { visibility: visible !important; }
          .qr-hoja { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="no-print sticky top-0 bg-[#F7F4EC] border-b border-[#E4DFCE] px-5 py-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#2F4A33]">Códigos QR de productos</h2>
          <p className="text-xs text-[#8A8368] max-w-md">Imprime, recorta y pega cada QR en su producto. Al escanearlo con la cámara del celular se abre la venta.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm font-medium bg-[#4B6B4F] text-white px-3 py-2 rounded-lg hover:bg-[#3A5540] transition">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button onClick={onClose} className="text-sm font-medium border border-[#E4DFCE] text-[#2F4A33] px-3 py-2 rounded-lg">Cerrar</button>
        </div>
      </div>
      <div className="qr-hoja px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {productos.map((p) => {
            const numericId = p.shopifyVariantId.split("/").pop();
            const url = `${origin}/?vender=${numericId}`;
            return (
              <div key={p.id} className="border border-[#E4DFCE] rounded-xl p-3 flex flex-col items-center text-center" style={{ breakInside: "avoid" }}>
                <QRCodeSVG value={url} size={128} level="M" />
                <p className="text-xs font-medium text-[#2F4A33] mt-2 leading-snug">{p.nombre}</p>
                <p className="text-xs text-[#8A8368]">Q{p.precio}</p>
              </div>
            );
          })}
        </div>
        {productos.length === 0 && <p className="text-sm text-[#8A8368] text-center py-8">No hay productos con inventario para generar códigos QR.</p>}
      </div>
    </div>
  );
}

// Escáner de códigos QR usando la cámara del celular/iPad, DENTRO de la app.
// Al leer un QR de producto (…?vender=IDVARIANTE) llama a onScan, que abre la
// venta. La librería html5-qrcode se carga solo cuando se abre el escáner.
function ScannerModal({ onScan, onClose }) {
  const [error, setError] = useState(null);
  const [listo, setListo] = useState(false);
  const yaLeido = useRef(false);

  useEffect(() => {
    let scanner;
    let cancelado = false;
    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (cancelado) return;
        scanner = new Html5Qrcode("qr-reader-region", { verbose: false });
        return scanner
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            (texto) => {
              if (yaLeido.current) return;
              yaLeido.current = true;
              onScan(texto);
            },
            () => {}
          )
          .then(() => { if (!cancelado) setListo(true); });
      })
      .catch(() => {
        if (!cancelado) setError("No pude abrir la cámara. Revisa que le hayas dado permiso de cámara a la app.");
      });

    return () => {
      cancelado = true;
      // Al cerrar, apagamos la cámara. Si el escáner nunca llegó a encender
      // (permiso denegado), stop() puede lanzar error: lo envolvemos para que
      // nunca tumbe la app.
      if (scanner) {
        try {
          const estado = scanner.getState ? scanner.getState() : 0;
          if (estado === 2) {
            scanner.stop().then(() => { try { scanner.clear(); } catch (e) {} }).catch(() => {});
          } else {
            try { scanner.clear(); } catch (e) {}
          }
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-[#2F4A33] text-white px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5" />
          <span className="font-serif text-lg font-bold">Escanear producto</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <div id="qr-reader-region" className="w-full max-w-sm rounded-2xl overflow-hidden bg-black" />
        {!listo && !error && (
          <p className="text-white/80 text-sm text-center">Preparando la cámara…</p>
        )}
        {listo && !error && (
          <p className="text-white/90 text-sm text-center max-w-xs">
            Apunta la cámara al código QR del producto. Se abre la venta solita. 📷
          </p>
        )}
        {error && (
          <div className="bg-white rounded-xl p-4 max-w-xs text-center">
            <p className="text-sm text-[#A6402F]">{error}</p>
            <button onClick={onClose} className="mt-3 text-sm font-medium text-[#4B6B4F]">Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SellForm({ target, onClose, onSubmit }) {
  const vendedorGuardado = (() => { try { return localStorage.getItem("vendedor_clinica") || ""; } catch (err) { return ""; } })();
  const [form, setForm] = useState({ cantidad: 1, metodoPago: target.metodoPago, precio: String(target.precio), vendedor: vendedorGuardado });
  const [enviando, setEnviando] = useState(false);

  const precioUnit = form.precio !== "" ? Number(form.precio) : target.precio;
  const total = (precioUnit || 0) * (Number(form.cantidad) || 1);
  const precioEspecial = Number(form.precio) !== target.precio;
  const puedeGuardar = form.vendedor.trim() !== "" && Number(form.cantidad) > 0 && !enviando;

  return (
    <Modal title={`Registrar venta: ${target.nombre}`} onClose={onClose}>
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-[#2F4A33]">Atendido por</span>
          <input type="text" value={form.vendedor} onChange={(e) => setForm((f) => ({ ...f, vendedor: e.target.value }))} autoFocus
            className="w-full mt-1 bg-white border border-[#E4DFCE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30"
            placeholder="Nombre de la persona" />
        </label>
        {target.tipo === "producto" && (
          <label className="block">
            <span className="text-xs font-medium text-[#2F4A33]">Cantidad vendida</span>
            <input type="number" min="1" max={target.stock} value={form.cantidad}
              onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
              className="w-full mt-1 bg-white border border-[#E4DFCE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30" />
            <span className="text-xs text-[#8A8368]">Disponible: {target.stock}</span>
          </label>
        )}
        <label className="block">
          <span className="text-xs font-medium text-[#2F4A33]">Precio unitario (Q)</span>
          <input type="number" min="0" value={form.precio} onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
            className="w-full mt-1 bg-white border border-[#E4DFCE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B6B4F]/30" />
          <span className="text-xs text-[#8A8368]">
            Precio normal: Q{target.precio}.{precioEspecial ? " Estás usando un precio especial." : " Puedes cambiarlo si hay precio especial."}
          </span>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-[#2F4A33]">Método de pago</span>
          <div className="flex gap-2 mt-1">
            {metodosPago.map(({ key, icon: Icon }) => (
              <button key={key} onClick={() => setForm((f) => ({ ...f, metodoPago: key }))}
                className={`flex-1 flex flex-col items-center gap-1 text-xs py-2 rounded-lg border transition ${form.metodoPago === key ? "bg-[#4B6B4F] text-white border-[#4B6B4F]" : "border-[#E4DFCE] text-[#2F4A33]"}`}>
                <Icon className="w-4 h-4" />
                {key}
              </button>
            ))}
          </div>
        </label>
        <div className="bg-[#F7F4EC] rounded-lg p-3 flex justify-between text-sm">
          <span className="text-[#2F4A33]">Total</span>
          <span className="font-serif font-bold text-[#4B6B4F]">Q{total.toFixed(2)}</span>
        </div>
        <button onClick={() => { if (!puedeGuardar) return; setEnviando(true); onSubmit(form); }} disabled={!puedeGuardar}
          className="w-full bg-[#4B6B4F] text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50">
          {enviando ? "Guardando..." : "Confirmar venta"}
        </button>
      </div>
    </Modal>
  );
}
