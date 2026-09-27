import { ArrowRight, Plus, Sparkles, X } from 'lucide-react'
import { money } from '../lib/format.js'

export default function UpsellModal({ recommendations, onAdd, onContinue, onClose }) {
  return (
    <div className="modal-layer center-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="dialog upsell-dialog" role="dialog" aria-modal="true" aria-label="Completa tu pedido">
        <button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="Cerrar"><X size={22} /></button>
        <div className="upsell-icon"><Sparkles size={29} /></div>
        <span className="eyebrow">EL TOQUE FINAL</span>
        <h2>Hazlo todavía<br /><em>más rico.</em></h2>
        <p className="dialog-intro">Quienes pidieron algo parecido también disfrutaron estos complementos.</p>
        <div className="upsell-list">
          {recommendations.map((item) => (
            <div className="upsell-item" key={item.id_producto}>
              <div className="upsell-item-icon">{item.nombre.slice(0, 1)}</div>
              <div><strong>{item.nombre}</strong><span>{money(item.precio_base)}</span></div>
              <button type="button" onClick={() => onAdd(item)} aria-label={`Agregar ${item.nombre}`}><Plus size={19} /></button>
            </div>
          ))}
        </div>
        <button className="primary-button full" type="button" onClick={onContinue}>Ir a pagar <ArrowRight size={19} /></button>
        <button className="text-button full" type="button" onClick={onContinue}>Continuar sin agregar más</button>
      </section>
    </div>
  )
}
