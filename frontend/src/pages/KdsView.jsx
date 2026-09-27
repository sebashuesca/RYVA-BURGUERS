import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChefHat, Check, Clock3, Flame, KeyRound, LogOut, Package, RefreshCw, ShieldCheck, Truck, Wifi, WifiOff } from 'lucide-react'
import { api, apiMessage } from '../lib/api.js'
import { timeLabel } from '../lib/format.js'

const columns = [
  { state: 'PENDIENTE', title: 'Por empezar', subtitle: 'Nuevas comandas', icon: Clock3, action: 'Iniciar preparación', next: 'EN_PREPARACION' },
  { state: 'EN_PREPARACION', title: 'En la plancha', subtitle: 'Cocinando ahora', icon: Flame, action: 'Marcar listo', next: 'LISTO' },
  { state: 'LISTO', title: 'Listo para salir', subtitle: 'Esperando despacho', icon: Check, action: 'Despachar pedido', next: 'EN_CAMINO' },
]

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return <div className="kds-clock"><strong>{new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(now)}</strong><span>{new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)}</span></div>
}

function CommandCard({ order, column, busy, onAdvance }) {
  const Icon = column.icon
  return (
    <article className={`command-card command-${column.state.toLowerCase()}`}>
      <div className="command-top"><span className="command-id">#{String(order.id_pedido).padStart(4, '0')}</span><span className="command-time"><Clock3 size={14} /> {timeLabel(order.fecha_hora)}</span></div>
      <div className="command-tag-row"><span className="command-status"><Icon size={15} /> {column.title}</span>{column.state !== 'LISTO' && <span className="priority-tag">P {Math.round(order.prioridad)}</span>}</div>
      <ul className="command-products">{order.productos.map((product, index) => <li key={`${product}-${index}`}>{product}</li>)}</ul>
      <div className="command-meta"><span><Clock3 size={15} /> {Math.floor(order.espera_minutos)} min desde pedido</span><span><ChefHat size={15} /> Prep. {order.preparacion_minutos} min</span></div>
      {order.grupo_plancha !== 'SIN_PLANCHA' && <div className="grill-group"><Flame size={15} /> Lote: {order.grupo_plancha}</div>}
      <button className="command-action" type="button" disabled={busy} onClick={() => onAdvance(order.id_pedido, column.next)}>{busy ? 'Actualizando…' : column.action} <ArrowRight size={18} /></button>
    </article>
  )
}

export default function KdsView() {
  const [key, setKey] = useState(() => sessionStorage.getItem('riva_admin_key') || '')
  const [keyInput, setKeyInput] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const loadOrders = useCallback(async (adminKey) => {
    if (!adminKey) return
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/pedidos/kds', { headers: { 'X-Admin-Key': adminKey } })
      setOrders(data)
      setLastUpdated(new Date())
      setError('')
    } catch (failure) {
      if (failure?.response?.status === 401) {
        sessionStorage.removeItem('riva_admin_key')
        setKey('')
        setError('Clave de cocina incorrecta. Vuelve a ingresarla.')
      } else {
        setError(apiMessage(failure))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!key) return undefined
    loadOrders(key)
    const interval = setInterval(() => loadOrders(key), 8000)
    return () => clearInterval(interval)
  }, [key, loadOrders])

  const grouped = useMemo(() => Object.fromEntries(columns.map((column) => [column.state, orders.filter((order) => order.estado_pedido === column.state)])), [orders])
  const activeCount = (grouped.PENDIENTE?.length || 0) + (grouped.EN_PREPARACION?.length || 0)

  function unlock(event) {
    event.preventDefault()
    if (!keyInput.trim()) return
    sessionStorage.setItem('riva_admin_key', keyInput.trim())
    setKey(keyInput.trim())
    setError('')
    setKeyInput('')
  }

  function logout() {
    sessionStorage.removeItem('riva_admin_key')
    setKey('')
    setOrders([])
  }

  async function advance(id, next) {
    setBusyId(id)
    try {
      await api.patch(`/api/v1/pedidos/${id}/estado`, { estado_pedido: next }, { headers: { 'X-Admin-Key': key } })
      await loadOrders(key)
    } catch (failure) {
      setError(apiMessage(failure))
    } finally {
      setBusyId(null)
    }
  }

  if (!key) {
    return <div className="kds-auth-screen"><div className="kds-auth-card"><div className="kds-logo">R<span>.</span></div><span className="eyebrow">ACCESO DE EQUIPO</span><h1>La cocina<br />empieza aquí.</h1><p>Ingresa la clave de operación para ver y mover las comandas en tiempo real.</p><form onSubmit={unlock}><label className="field">Clave de cocina<div className="key-input-wrap"><KeyRound size={18} /><input type="password" required value={keyInput} onChange={(event) => setKeyInput(event.target.value)} placeholder="Clave administrativa" autoFocus /></div></label><button className="primary-button full" type="submit">Abrir tablero <ArrowRight size={19} /></button></form>{error && <p className="form-error">{error}</p>}<span className="auth-footnote"><ShieldCheck size={16} /> La clave se guarda solo durante esta sesión.</span><a href="#/">Volver al menú</a></div></div>
  }

  return (
    <div className="kds-shell">
      <header className="kds-header"><div className="kds-heading"><div className="kds-logo small">R<span>.</span></div><div><span className="eyebrow">RIVA BURGUERS · OPERACIÓN</span><h1>Tablero de cocina</h1></div></div><div className="kds-header-right"><div className="kds-live"><span className="live-dot" /> EN VIVO · 8 S</div><Clock /><a className="kds-header-button" href="#/admin" aria-label="Administrar productos" title="Administrar productos"><Package size={19} /></a><button className="kds-header-button" type="button" onClick={() => loadOrders(key)} aria-label="Actualizar comandas"><RefreshCw size={20} className={loading ? 'spin' : ''} /></button><button className="kds-header-button" type="button" onClick={logout} aria-label="Cerrar sesión"><LogOut size={20} /></button></div></header>
      <main className="kds-main"><div className="kds-overview"><div><span className="eyebrow">EN ESTE TURNO</span><h2>Vamos con todo<span className="accent-dot">.</span></h2><p>Ordenadas por prioridad y agrupadas para aprovechar la plancha.</p></div><div className="kds-stats"><div><strong>{activeCount}</strong><span>EN COCINA</span></div><div><strong>{grouped.LISTO?.length || 0}</strong><span>PARA SALIR</span></div><div className="connection-stat">{error ? <WifiOff size={23} /> : <Wifi size={23} />}<span>{error ? 'SIN CONEXIÓN' : 'CONECTADO'}</span></div></div></div>{error && <div className="kds-error" role="alert">{error} <button type="button" onClick={() => loadOrders(key)}>Reintentar</button></div>}<div className="kanban-grid">{columns.map((column) => { const Icon = column.icon; const current = grouped[column.state] || []; return <section className={`kanban-column kanban-${column.state.toLowerCase()}`} key={column.state}><div className="kanban-heading"><div className="kanban-icon"><Icon size={21} /></div><div><h3>{column.title}</h3><p>{column.subtitle}</p></div><span className="kanban-count">{current.length}</span></div><div className="kanban-cards">{current.length ? current.map((order) => <CommandCard key={order.id_pedido} order={order} column={column} busy={busyId === order.id_pedido} onAdvance={advance} />) : <div className="empty-column"><Icon size={28} strokeWidth={1.5} /><strong>Todo al día</strong><span>Las comandas aparecerán aquí.</span></div>}</div></section> })}</div><div className="kds-footer"><span>La prioridad se actualiza con el tiempo de espera.</span><span>{lastUpdated ? `Última actualización: ${new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastUpdated)}` : 'Cargando comandas…'}</span></div></main>
    </div>
  )
}
