import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { money } from '../lib/format.js'

export default function CartDrawer({ lines, open, onClose, onQuantity, onCheckout }) {
  if (!open) return null
  const subtotal = lines.reduce((sum, line) => sum + Number(line.product.precio_base) * line.cantidad, 0)

  return (
    <div className="modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Tu carrito">
        <div className="drawer-header">
          <div><span className="eyebrow">TU PEDIDO</span><h2>Tu carrito<span className="accent-dot">.</span></h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar carrito"><X size={22} /></button>
        </div>
        <div className="cart-items">
          {lines.length === 0 ? (
            <div className="empty-cart"><ShoppingBag size={44} strokeWidth={1.3} /><h3>Por aquí hay hambre</h3><p>Explora el menú y agrega algo delicioso.</p></div>
          ) : lines.map(({ product, cantidad }) => (
            <div className="cart-line" key={product.id_producto}>
              <div className="cart-line-image">{product.nombre.slice(0, 1)}</div>
              <div className="cart-line-main">
                <h3>{product.nombre}</h3>
                <p>{money(product.precio_base)} c/u</p>
                <div className="quantity-control">
                  <button type="button" onClick={() => onQuantity(product.id_producto, cantidad - 1)} aria-label={`Quitar uno de ${product.nombre}`}><Minus size={15} /></button>
                  <span>{cantidad}</span>
                  <button type="button" onClick={() => onQuantity(product.id_producto, cantidad + 1)} aria-label={`Agregar uno de ${product.nombre}`}><Plus size={15} /></button>
                </div>
              </div>
              <div className="cart-line-end"><strong>{money(Number(product.precio_base) * cantidad)}</strong><button type="button" onClick={() => onQuantity(product.id_producto, 0)} aria-label={`Eliminar ${product.nombre}`}><Trash2 size={17} /></button></div>
            </div>
          ))}
        </div>
        <div className="drawer-footer">
          <div className="total-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <p>El envío se calcula con tu ubicación al finalizar.</p>
          <button className="primary-button full" type="button" disabled={!lines.length} onClick={onCheckout}>Continuar pedido <ArrowRight size={19} /></button>
        </div>
      </aside>
    </div>
  )
}
