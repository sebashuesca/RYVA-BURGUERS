import { ArrowUpRight, Plus } from 'lucide-react'
import { categoryName, money } from '../lib/format.js'
import ProductArt from './ProductArt.jsx'

export default function ProductCard({ product, onAdd }) {
  const category = categoryName(product.id_categoria)
  return (
    <article className="product-card">
      <div className={`product-art product-art-${category.toLowerCase().replaceAll(' ', '-')}`}>
        <span className="product-category">{category}</span>
        <ProductArt product={product} />
        <ArrowUpRight className="product-corner" size={20} strokeWidth={1.5} />
      </div>
      <div className="product-details">
        <div>
          <h3>{product.nombre}</h3>
          <p>{product.descripcion || 'Preparado al momento en la cocina RIVA.'}</p>
        </div>
        <div className="product-bottom">
          <strong>{money(product.precio_base)}</strong>
          <button className="round-add" type="button" onClick={() => onAdd(product)} aria-label={`Agregar ${product.nombre} al carrito`}>
            <Plus size={20} strokeWidth={2.3} />
          </button>
        </div>
      </div>
    </article>
  )
}
