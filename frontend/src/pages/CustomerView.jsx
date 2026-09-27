import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowRight, ChefHat, Clock3, Flame, MapPin, Menu, Search, ShoppingBag, Sparkles } from 'lucide-react'
import { api, apiMessage } from '../lib/api.js'
import { categoryName, money } from '../lib/format.js'
import ProductArt from '../components/ProductArt.jsx'
import ProductCard from '../components/ProductCard.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import UpsellModal from '../components/UpsellModal.jsx'
import CheckoutModal, { SuccessModal } from '../components/CheckoutModal.jsx'

function initialCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('riva_cart') || '[]')
    return Array.isArray(saved) ? saved : []
  } catch { return [] }
}

export default function CustomerView() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [category, setCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState(initialCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [upsellOpen, setUpsellOpen] = useState(false)
  const [upsellBusy, setUpsellBusy] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [success, setSuccess] = useState(null)
  const [toast, setToast] = useState('')

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const { data } = await api.get('/api/v1/productos')
      setProducts(data)
      setCart((previous) => previous.filter((line) => data.some((product) => product.id_producto === line.id_producto)))
    } catch (error) {
      setLoadError(apiMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])
  useEffect(() => { localStorage.setItem('riva_cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  const categories = useMemo(() => ['Todos', ...new Set(products.map((product) => categoryName(product.id_categoria)))], [products])
  const filtered = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'Todos' || categoryName(product.id_categoria) === category
    const matchesSearch = `${product.nombre} ${product.descripcion || ''}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
    return matchesCategory && matchesSearch
  }), [products, category, search])
  const lines = useMemo(() => cart.map((line) => ({ product: products.find((product) => product.id_producto === line.id_producto), cantidad: line.cantidad })).filter((line) => line.product), [cart, products])
  const itemCount = lines.reduce((sum, line) => sum + line.cantidad, 0)
  const subtotal = lines.reduce((sum, line) => sum + Number(line.product.precio_base) * line.cantidad, 0)

  function changeQuantity(id, quantity) {
    setCart((previous) => {
      if (quantity <= 0) return previous.filter((line) => line.id_producto !== id)
      if (quantity > 100) return previous
      const exists = previous.some((line) => line.id_producto === id)
      return exists
        ? previous.map((line) => line.id_producto === id ? { ...line, cantidad: quantity } : line)
        : [...previous, { id_producto: id, cantidad: quantity }]
    })
  }

  function addProduct(product) {
    setCart((previous) => {
      const current = previous.find((line) => line.id_producto === product.id_producto)?.cantidad || 0
      if (current >= 100) return previous
      return current
        ? previous.map((line) => line.id_producto === product.id_producto ? { ...line, cantidad: current + 1 } : line)
        : [...previous, { id_producto: product.id_producto, cantidad: 1 }]
    })
    setToast(`${product.nombre} añadido al carrito`)
  }

  async function beginCheckout() {
    if (!lines.length) return
    setCartOpen(false)
    setUpsellBusy(true)
    try {
      const { data } = await api.post('/api/v1/recomendaciones', { ids_productos: lines.map(({ product }) => product.id_producto) })
      if (data.length) {
        setRecommendations(data)
        setUpsellOpen(true)
      } else {
        setCheckoutOpen(true)
      }
    } catch {
      setCheckoutOpen(true)
    } finally {
      setUpsellBusy(false)
    }
  }

  function finishOrder(order) {
    setCheckoutOpen(false)
    setCart([])
    setSuccess(order)
  }

  return (
    <div className="site-shell">
      <div className="announcement"><Flame size={15} fill="currentColor" /> HECHAS AL MOMENTO · ENTREGAS A 5 KM DE LA COCINA <Flame size={15} fill="currentColor" /></div>
      <header className="site-header"><a className="brand" href="#/" aria-label="RIVA BURGUERS, inicio"><span className="brand-mark">R<span>.</span></span><span className="brand-words">RIVA<strong>BURGUERS</strong></span></a><nav className="header-nav"><a href="#menu">Menú</a><a href="#nosotros">Nuestra cocina</a><a href="#/kds" className="staff-link">Acceso cocina</a></nav><button className="header-cart" type="button" onClick={() => setCartOpen(true)} aria-label={`Abrir carrito con ${itemCount} productos`}><ShoppingBag size={20} /><span>Tu pedido</span>{itemCount > 0 && <b>{itemCount}</b>}</button></header>

      <main>
        <section className="hero"><div className="hero-inner"><div className="hero-copy"><div className="hero-kicker"><span className="kicker-line" /> BURGERS DE OTRO NIVEL</div><h1>EL ANTOJO<br />TIENE <em>NOMBRE.</em></h1><p>Pan suave, carne a la plancha y ese primer mordisco que cambia el día. Bienvenido a RIVA.</p><button className="primary-button hero-cta" type="button" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>Explorar el menú <ArrowRight size={21} /></button><div className="hero-highlights"><span><Clock3 size={18} /> Hechas al momento</span><span><MapPin size={18} /> Hasta 5 km</span></div></div><div className="hero-visual"><div className="hero-sun" /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><ProductArt product={{ id_categoria: 1 }} large /><div className="hero-sticker"><span>100%</span><small>ANTOJO<br />REAL</small></div><div className="hero-label">SMASHED<br />TO PERFECTION <ArrowDownRight size={26} /></div></div></div><div className="hero-bottom"><span>RIVA BURGUERS · DARK KITCHEN</span><span>DESLIZA PARA DESCUBRIR <ArrowDownRight size={17} /></span></div></section>

        <section className="value-strip" id="nosotros"><div><span className="value-icon"><Flame size={24} /></span><strong>Sabor que se nota</strong><p>Cada hamburguesa sale caliente de la plancha.</p></div><div><span className="value-icon"><ChefHat size={24} /></span><strong>Ingredientes con intención</strong><p>Una receta hecha para repetir el primer mordisco.</p></div><div><span className="value-icon"><MapPin size={24} /></span><strong>Cerca de ti</strong><p>Calculamos el envío según tu ubicación real.</p></div></section>

        <section className="menu-section" id="menu"><div className="section-heading"><div><span className="eyebrow">ELIGE TU FAVORITA</span><h2>BUENO HASTA<br /><em>EL ÚLTIMO BOCADO.</em></h2></div><p>De la plancha a tu puerta. Explora, combina y arma tu pedido RIVA.</p></div><div className="menu-controls"><div className="category-tabs" role="tablist" aria-label="Categorías del menú">{categories.map((item) => <button key={item} type="button" role="tab" aria-selected={category === item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en el menú" aria-label="Buscar productos" /></label></div>
          {loading ? <div className="menu-message"><div className="loader" /><h3>Calentando la plancha…</h3></div> : loadError ? <div className="menu-message"><h3>No pudimos cargar el menú</h3><p>{loadError}</p><button className="outline-button" type="button" onClick={loadProducts}>Intentar de nuevo</button></div> : filtered.length ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id_producto} product={product} onAdd={addProduct} />)}</div> : <div className="menu-message"><Search size={30} /><h3>Sin resultados por ahora</h3><p>Prueba otra categoría o término de búsqueda.</p></div>}
        </section>

        <section className="closing-banner"><div><span className="eyebrow">HECHO EN RIVA</span><h2>Tu próxima favorita<br /><em>está aquí.</em></h2><p>Arma el combo a tu manera y deja que la cocina haga el resto.</p></div><button className="light-button" type="button" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>Volver al menú <ArrowRight size={20} /></button><Sparkles className="closing-spark" size={220} strokeWidth={.7} /></section>
      </main>

      <footer className="site-footer"><div className="brand brand-footer"><span className="brand-mark">R<span>.</span></span><span className="brand-words">RIVA<strong>BURGUERS</strong></span></div><p>Hamburguesas hechas para antojar. © {new Date().getFullYear()} RIVA BURGUERS.</p><a href="#/kds">Cocina</a></footer>
      {itemCount > 0 && <button className="mobile-cart-bar" type="button" onClick={() => setCartOpen(true)}><ShoppingBag size={19} /><span>Ver pedido · {itemCount} productos</span><strong>{money(subtotal)}</strong></button>}
      {toast && <div className="toast" role="status"><Sparkles size={18} /> {toast}</div>}
      {upsellBusy && <div className="busy-pill">Preparando sugerencias…</div>}
      <CartDrawer open={cartOpen} lines={lines} onClose={() => setCartOpen(false)} onQuantity={changeQuantity} onCheckout={beginCheckout} />
      {upsellOpen && <UpsellModal recommendations={recommendations} onAdd={addProduct} onClose={() => setUpsellOpen(false)} onContinue={() => { setUpsellOpen(false); setCheckoutOpen(true) }} />}
      {checkoutOpen && <CheckoutModal lines={lines} onClose={() => setCheckoutOpen(false)} onSuccess={finishOrder} />}
      {success && <SuccessModal order={success} onClose={() => setSuccess(null)} />}
    </div>
  )
}
