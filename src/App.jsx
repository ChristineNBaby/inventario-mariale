import React, { useState, useEffect } from "react";
import { Plus, Package, Receipt, Search, X, Camera, TrendingDown, DollarSign, RefreshCw, CreditCard, Banknote, Landmark, Calendar, Link2, ListChecks } from "lucide-react";

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
// terminan expuestas en el navegador). Vive solo en el servidor, dentro de /api/set-inventory,
// y este código le pide a esa función que haga el trabajo por nosotros.

// Descuenta el stock de un producto en Shopify, en la ubicación "Clínica", a través
// de la función de servidor /api/set-inventory. Devuelve { ok: true } si funcionó, o
// { ok: false, error } si algo falló — la venta en la app se guarda de todos modos,
// para nunca perder el registro.
async function descontarStockEnShopify(inventoryItemId, cantidadVendida, stockActualEnShopify) {
  try {
    const nuevaCantidad = Math.max(0, stockActualEnShopify - cantidadVendida);
    const response = await fetch("/api/set-inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inventoryItemId,
        locationId: SHOPIFY_LOCATION_ID,
        quantity: nuevaCantidad,
      }),
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
  const [sales, setSales] = useState([]);
  const [tab, setTab] = useState("inventario");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sellTarget, setSellTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [shopifySynced, setShopifySynced] = useState(false);
  const [confirmacionStock, setConfirmacionStock] = useState(null);
  const [showResumen, setShowResumen] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // Al abrir la app, trae el catálogo real y actualizado desde Shopify.
  // Si falla (sin conexión, Shopify no configurado, etc.), se queda con los
  // productos de prueba para que la app siga siendo utilizable.
  useEffect(() => {
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
  }, []);

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
    setSales((prev) => [{
      id: Date.now(), productoId: producto.id, nombre: producto.nombre, cantidad,
      precio: producto.precio, metodoPago: form.metodoPago, canal: "Presencial", fecha: new Date().toISOString(),
    }, ...prev]);

    let nuevoStock = null;
    let shopifyResultado = null;

    if (producto.tipo === "producto") {
      nuevoStock = Math.max(0, producto.stock - cantidad);
      // 1. Actualiza primero en la app, para que se vea al instante sin esperar a Shopify
      setProducts((prev) => prev.map((p) => p.id === producto.id ? { ...p, stock: nuevoStock } : p));

      // 2. Intenta descontar el mismo stock en Shopify (ubicación Clínica)
      if (producto.shopifyVariantId) {
        shopifyResultado = await descontarStockEnShopify(producto.shopifyVariantId, cantidad, producto.stock);
      }
    }

    setSellTarget(null);
    setConfirmacionStock({
      nombre: producto.nombre,
      tipo: producto.tipo,
      stock: nuevoStock,
      cantidad,
      total: producto.precio * cantidad,
      shopifyOk: shopifyResultado ? shopifyResultado.ok : null,
      shopifyError: shopifyResultado && !shopifyResultado.ok ? shopifyResultado.error : null,
    });
    setTimeout(() => setConfirmacionStock(null), 4000);
  }

  const totalVentas = sales.reduce((sum, s) => sum + s.precio * s.cantidad, 0);
  const stockBajo = products.filter((p) => p.tipo === "producto" && p.stock <= 3).length;

  // Reporte agrupado por día
  const porDia = sales.reduce((acc, s) => {
    const dia = new Date(s.fecha).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(s);
    return acc;
  }, {});

  const totalPresencial = sales.filter((s) => s.canal === "Presencial").reduce((s2, v) => s2 + v.precio * v.cantidad, 0);
  const totalEnLinea = sales.filter((s) => s.canal === "En línea").reduce((s2, v) => s2 + v.precio * v.cantidad, 0);

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
            onClick={() => setShopifySynced((s) => !s)}
            className="flex items-center gap-1.5 text-xs bg-white border border-[#E4DFCE] px-2.5 py-1 rounded-full ml-auto"
          >
            <Link2 className="w-3.5 h-3.5 text-[#6B4E71]" />
            <span className={shopifySynced ? "text-[#4B6B4F]" : "text-[#8A8368]"}>
              {shopifySynced ? "Shopify conectado" : "Shopify no conectado"}
            </span>
          </button>
        </div>
      </header>

      <div className="flex px-5 gap-2 mt-4">
        <button onClick={() => setTab("inventario")} className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition ${tab === "inventario" ? "bg-[#4B6B4F] text-white" : "bg-white text-[#2F4A33] border border-[#E4DFCE]"}`}>
          <Package className="w-4 h-4" /> Inventario
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
                    {s.cantidad} × Q{s.precio} · {s.metodoPago}
                  </p>
                  <p className="text-xs text-[#8A8368]">
                    {new Date(s.fecha).toLocaleDateString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className="font-serif font-bold text-[#4B6B4F]">Q{s.precio * s.cantidad}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "reporte" && (
          <div className="space-y-5">
            {Object.keys(porDia).length > 0 && (
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
            {Object.keys(porDia).length === 0 && <p className="text-sm text-[#8A8368] text-center py-8">Aún no hay ventas para reportar.</p>}
            {Object.entries(porDia).map(([dia, ventasDia]) => {
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

      {tab === "inventario" && (
        <button onClick={() => setShowAdd(true)} className="fixed bottom-6 right-6 bg-[#4B6B4F] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-[#3A5540] transition">
          <Plus className="w-6 h-6" />
        </button>
      )}

      {showAdd && <ProductForm title="Nuevo producto o servicio" onClose={() => setShowAdd(false)} onSubmit={handleAddProduct} />}
      {editTarget && <ProductForm title="Editar" initial={editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEditProduct} />}
      {sellTarget && <SellForm target={sellTarget} onClose={() => setSellTarget(null)} onSubmit={handleSell} />}
      {showResumen && <ResumenInventario products={products} onClose={() => setShowResumen(false)} />}
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

function SellForm({ target, onClose, onSubmit }) {
  const [form, setForm] = useState({ cantidad: 1, metodoPago: target.metodoPago });

  return (
    <Modal title={`Registrar venta: ${target.nombre}`} onClose={onClose}>
      <div className="space-y-3">
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
          <span className="font-serif font-bold text-[#4B6B4F]">Q{(target.precio * (Number(form.cantidad) || 1)).toFixed(2)}</span>
        </div>
        <button onClick={() => onSubmit(form)} className="w-full bg-[#4B6B4F] text-white py-2.5 rounded-lg font-medium text-sm">
          Confirmar venta
        </button>
      </div>
    </Modal>
  );
}
