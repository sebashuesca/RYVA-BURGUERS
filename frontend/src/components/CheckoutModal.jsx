import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CreditCard, Crosshair, LockKeyhole, MapPin, PackageCheck, Truck, X } from 'lucide-react'
import { api, apiMessage } from '../lib/api.js'
import { localDistance } from '../lib/haversine.js'
import { money, timeLabel } from '../lib/format.js'

function savedCustomer() {
  try { return JSON.parse(localStorage.getItem('riva_customer') || 'null') } catch { return null }
}

export default function CheckoutModal({ lines, onClose, onSuccess }) {
  const [customer, setCustomer] = useState(savedCustomer)
  const [accountMode, setAccountMode] = useState('register')
  const [account, setAccount] = useState({ nombre: '', email: '', password: '', telefono: '' })
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteBusy, setQuoteBusy] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + Number(line.product.precio_base) * line.cantidad, 0), [lines])
  const coordinatesReady = lat.trim() !== '' && lon.trim() !== ''
    && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))
    && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180
  const approximateKm = coordinatesReady ? localDistance(lat, lon) : null

  useEffect(() => {
    if (!coordinatesReady) {
      setQuote(null)
      setQuoteError('')
      return
    }
    let active = true
    setQuote(null)
    setQuoteBusy(true)
    setQuoteError('')
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.post('/api/v1/pedidos/cotizar', { latitud: Number(lat), longitud: Number(lon) })
        if (active) setQuote(data)
      } catch (error) {
        if (active) setQuoteError(apiMessage(error))
      } finally {
        if (active) setQuoteBusy(false)
      }
    }, 450)
    return () => { active = false; clearTimeout(timer) }
  }, [lat, lon, coordinatesReady])

  function locate() {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no ofrece ubicación. Escribe tus coordenadas.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLat(coords.latitude.toFixed(7)); setLon(coords.longitude.toFixed(7)) },
      () => setLocationError('No pudimos obtener tu ubicación. Puedes escribir las coordenadas.'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function getCustomerId() {
    if (customer?.id_usuario) return customer.id_usuario
    const credentials = { email: account.email.trim(), password: account.password }
    const payload = accountMode === 'login'
      ? credentials
      : { ...credentials, nombre: account.nombre.trim(), telefono: account.telefono.trim() || null }
    const endpoint = accountMode === 'login' ? '/api/v1/usuarios/login' : '/api/v1/usuarios'
    const { data } = await api.post(endpoint, payload)
    const saved = { id_usuario: data.id_usuario, nombre: data.nombre }
    localStorage.setItem('riva_customer', JSON.stringify(saved))
    setCustomer(saved)
    return saved.id_usuario
  }

  async function confirmOrder(event) {
    event.preventDefault()
    if (!quote || submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const userId = await getCustomerId()
      const { data } = await api.post('/api/v1/pedidos', {
        id_usuario: userId,
        direccion_entrega: address.trim(),
        latitud: Number(lat),
        longitud: Number(lon),
        metodo_pago: 'EFECTIVO',
        items: lines.map(({ product, cantidad }) => ({ id_producto: product.id_producto, cantidad })),
      })
      onSuccess(data)
    } catch (error) {
      setSubmitError(apiMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-layer center-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="dialog checkout-dialog" role="dialog" aria-modal="true" aria-label="Finalizar pedido">
        <div className="checkout-top"><div><span className="eyebrow">YA CASI ES TUYO</span><h2>Finaliza tu pedido<span className="accent-dot">.</span></h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={22} /></button></div>
        <div className="checkout-layout">
          <form id="checkout-form" className="checkout-fields" onSubmit={confirmOrder}>
            <div className="form-section-title"><span>01</span><div><h3>Tu cuenta</h3><p>Así sabremos a quién entregar.</p></div></div>
            {customer ? (
              <div className="account-saved"><div className="account-avatar">{customer.nombre?.[0]?.toUpperCase() || 'R'}</div><div><strong>{customer.nombre}</strong><span>Cliente #{customer.id_usuario}</span></div><button type="button" onClick={() => { localStorage.removeItem('riva_customer'); setCustomer(null) }}>Cambiar</button></div>
            ) : (
              <>
                <div className="account-tabs"><button type="button" className={accountMode === 'register' ? 'active' : ''} onClick={() => setAccountMode('register')}>Soy nuevo</button><button type="button" className={accountMode === 'login' ? 'active' : ''} onClick={() => setAccountMode('login')}>Ya tengo cuenta</button></div>
                {accountMode === 'register' && <div className="field-grid"><label className="field full-field">Nombre<input required minLength="1" maxLength="120" value={account.nombre} onChange={(event) => setAccount({ ...account, nombre: event.target.value })} placeholder="Tu nombre completo" /></label><label className="field full-field">Teléfono <span className="optional">opcional</span><input maxLength="25" value={account.telefono} onChange={(event) => setAccount({ ...account, telefono: event.target.value })} placeholder="55 1234 5678" /></label></div>}
                <div className="field-grid"><label className="field">Correo electrónico<input type="email" required value={account.email} onChange={(event) => setAccount({ ...account, email: event.target.value })} placeholder="tu@correo.com" /></label><label className="field">Contraseña<input type="password" required minLength={accountMode === 'register' ? 8 : undefined} value={account.password} onChange={(event) => setAccount({ ...account, password: event.target.value })} placeholder="••••••••" /></label></div>
              </>
            )}

            <div className="form-section-title section-gap"><span>02</span><div><h3>Entrega</h3><p>Hasta 5 km de nuestra cocina.</p></div></div>
            <label className="field">Dirección completa<input required minLength="5" maxLength="300" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Calle, número, colonia y referencias" /></label>
            <button className="location-button" type="button" onClick={locate}><Crosshair size={18} /> Usar mi ubicación actual</button>
            {locationError && <p className="form-error">{locationError}</p>}
            <div className="field-grid"><label className="field">Latitud<input type="number" step="any" min="-90" max="90" required value={lat} onChange={(event) => setLat(event.target.value)} placeholder="19.4326000" /></label><label className="field">Longitud<input type="number" step="any" min="-180" max="180" required value={lon} onChange={(event) => setLon(event.target.value)} placeholder="-99.1332000" /></label></div>
            {approximateKm !== null && <p className="distance-hint"><MapPin size={15} /> Distancia aproximada: {approximateKm.toFixed(2)} km. La cotización final la calcula la cocina.</p>}
            {quoteBusy && <p className="distance-hint">Calculando cobertura y tiempo de entrega…</p>}
            {quoteError && <p className="form-error">{quoteError}</p>}
            {quote && <div className="delivery-ok"><Check size={18} /><span>¡Llegamos hasta ti! {quote.distancia_km.toFixed(2)} km · aprox. {quote.eta_minutos} min</span></div>}
            <div className="payment-note"><CreditCard size={19} /><div><strong>Pago en efectivo al recibir</strong><span>El pedido queda pendiente de pago. No se realiza un cargo en línea.</span></div></div>
            {submitError && <p className="form-error">{submitError}</p>}
          </form>
          <aside className="checkout-summary">
            <span className="eyebrow">RESUMEN DE PEDIDO</span>
            <div className="summary-lines">{lines.map(({ product, cantidad }) => <div key={product.id_producto}><span>{cantidad}× {product.nombre}</span><strong>{money(Number(product.precio_base) * cantidad)}</strong></div>)}</div>
            <div className="summary-prices"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Envío</span><strong>{quote ? money(quote.tarifa_envio) : 'Por calcular'}</strong></div></div>
            <div className="summary-total"><span>Total estimado</span><strong>{money(subtotal + Number(quote?.tarifa_envio || 0))}</strong></div>
            {quote && <div className="summary-eta"><Truck size={21} /><div><strong>Llegada estimada</strong><span>{timeLabel(quote.llegada_estimada)}</span></div></div>}
            <button className="primary-button full" form="checkout-form" type="submit" disabled={!quote || submitting || !address.trim()}>{submitting ? 'Confirmando…' : 'Confirmar pedido'} <ArrowRight size={19} /></button>
            <span className="secure-note"><LockKeyhole size={14} /> Tu pedido se confirma con la cocina RIVA</span>
          </aside>
        </div>
      </section>
    </div>
  )
}

export function SuccessModal({ order, onClose }) {
  return (
    <div className="modal-layer center-layer">
      <section className="dialog success-dialog" role="dialog" aria-modal="true" aria-label="Pedido confirmado">
        <div className="success-icon"><PackageCheck size={40} /></div>
        <span className="eyebrow">¡HECHO!</span>
        <h2>La cocina ya<br /><em>se puso en marcha.</em></h2>
        <p>Tu pedido <strong>#{order.id_pedido}</strong> fue recibido. Ten listo el pago en efectivo al momento de la entrega.</p>
        <div className="success-facts"><div><Truck size={19} /><span>Entrega aprox. {order.eta_minutos} min</span></div><div><CreditCard size={19} /><span>Total {money(order.total)}</span></div></div>
        <button className="primary-button full" type="button" onClick={onClose}>Volver al menú <ArrowLeft size={19} /></button>
      </section>
    </div>
  )
}
