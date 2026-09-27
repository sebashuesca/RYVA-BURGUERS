import { categoryName } from '../lib/format.js'

function BurgerSvg({ large }) {
  return (
    <svg className={`food-svg ${large ? 'food-svg-large' : ''}`} viewBox="0 0 360 260" role="img" aria-label="Ilustración de hamburguesa">
      <defs>
        <linearGradient id="bun" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffd27b" /><stop offset="1" stopColor="#ce792f" /></linearGradient>
        <linearGradient id="patty" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#683729" /><stop offset="1" stopColor="#321d1b" /></linearGradient>
        <filter id="foodShadow"><feDropShadow dx="0" dy="17" stdDeviation="12" floodOpacity=".28" /></filter>
      </defs>
      <ellipse cx="180" cy="222" rx="128" ry="17" fill="#17120d" opacity=".25" />
      <g filter="url(#foodShadow)">
        <path d="M65 185 Q180 211 295 185 L284 211 Q180 233 76 211 Z" fill="url(#bun)" />
        <path d="M60 166 Q180 149 300 166 L292 190 Q180 207 68 190 Z" fill="url(#patty)" />
        <path d="M72 151 Q118 147 160 154 L182 178 L204 153 Q252 146 286 152 L278 171 Q176 185 78 171 Z" fill="#f7bc39" />
        <path d="M57 149 C87 133 96 163 122 146 C146 129 162 158 183 145 C204 129 230 157 251 144 C275 131 292 147 305 144 L298 159 C268 151 258 170 232 154 C207 143 191 166 168 153 C148 145 122 170 98 153 C78 142 69 164 57 158 Z" fill="#7ca936" />
        <path d="M64 133 Q180 145 296 133 L293 147 Q180 156 67 147 Z" fill="#cf5440" />
        <path d="M65 132 Q69 51 180 43 Q291 50 295 132 Q181 146 65 132 Z" fill="url(#bun)" />
        <path d="M66 125 Q180 139 294 125" stroke="#ffe09b" strokeWidth="7" fill="none" opacity=".65" />
        <g fill="#fff1c8" transform="rotate(-11 180 88)">
          <ellipse cx="115" cy="84" rx="5" ry="2" /><ellipse cx="145" cy="68" rx="5" ry="2" />
          <ellipse cx="178" cy="78" rx="5" ry="2" /><ellipse cx="213" cy="65" rx="5" ry="2" />
          <ellipse cx="245" cy="88" rx="5" ry="2" /><ellipse cx="99" cy="110" rx="5" ry="2" />
          <ellipse cx="155" cy="105" rx="5" ry="2" /><ellipse cx="203" cy="104" rx="5" ry="2" />
          <ellipse cx="260" cy="112" rx="5" ry="2" />
        </g>
      </g>
    </svg>
  )
}

function FriesSvg() {
  return (
    <svg className="food-svg" viewBox="0 0 360 260" role="img" aria-label="Ilustración de papas">
      <ellipse cx="180" cy="220" rx="105" ry="15" fill="#17120d" opacity=".23" />
      <g transform="rotate(-3 180 135)">
        <path d="M94 77 L107 71 L133 165 L119 172 Z M124 49 L139 48 L151 157 L136 161 Z M154 60 L169 58 L172 158 L158 159 Z M182 42 L199 43 L192 165 L176 162 Z M214 55 L231 59 L208 166 L193 163 Z M247 71 L262 78 L224 173 L210 167 Z" fill="#ffd465" stroke="#e6a23b" strokeWidth="3" />
        <path d="M74 125 Q180 145 286 125 L259 210 Q181 230 101 210 Z" fill="#db5442" />
        <path d="M82 133 Q180 151 278 133" fill="none" stroke="#f77a59" strokeWidth="9" />
        <path d="M120 163 Q180 150 240 163" fill="none" stroke="#ffcc87" strokeWidth="5" opacity=".6" />
        <text x="180" y="196" textAnchor="middle" fontSize="32" fontFamily="Arial Black, sans-serif" fontWeight="900" fill="#fff4e6">R</text>
      </g>
    </svg>
  )
}

function DrinkSvg() {
  return (
    <svg className="food-svg" viewBox="0 0 360 260" role="img" aria-label="Ilustración de bebida">
      <ellipse cx="180" cy="224" rx="87" ry="14" fill="#17120d" opacity=".2" />
      <path d="M190 26 L230 10" stroke="#f8d77a" strokeWidth="8" strokeLinecap="round" />
      <path d="M186 30 L169 145" stroke="#f8d77a" strokeWidth="8" strokeLinecap="round" />
      <path d="M91 72 Q180 90 269 72 L247 205 Q180 224 113 205 Z" fill="#d35c40" />
      <path d="M99 77 Q180 94 261 77 L243 199 Q180 214 117 199 Z" fill="#9c332d" />
      <path d="M99 77 Q180 95 261 77" fill="none" stroke="#ffde93" strokeWidth="10" />
      <path d="M118 107 Q180 119 243 107" fill="none" stroke="#e77e56" strokeWidth="8" opacity=".6" />
      <circle cx="180" cy="153" r="34" fill="#e8b258" /><text x="180" y="165" textAnchor="middle" fontSize="36" fontFamily="Arial Black, sans-serif" fill="#9c332d">R</text>
      <path d="M91 72 Q180 56 269 72" fill="none" stroke="#f7c981" strokeWidth="9" />
    </svg>
  )
}

function ExtraSvg() {
  return (
    <svg className="food-svg" viewBox="0 0 360 260" role="img" aria-label="Ilustración de queso">
      <ellipse cx="180" cy="222" rx="102" ry="13" fill="#17120d" opacity=".2" />
      <path d="M78 163 L260 89 L293 194 L109 220 Z" fill="#ffcf53" stroke="#e7a534" strokeWidth="7" />
      <path d="M78 163 Q101 144 122 159 Q143 175 166 151 Q187 131 211 144 Q232 155 260 89 L293 194 L109 220 Z" fill="#f7b73c" opacity=".8" />
      <circle cx="165" cy="178" r="11" fill="#df9c2e" /><circle cx="235" cy="172" r="8" fill="#df9c2e" />
    </svg>
  )
}

export default function ProductArt({ product, large = false }) {
  const category = categoryName(product?.id_categoria || 1)
  if (product?.imagen_url) {
    return <img className="product-photo" src={product.imagen_url} alt={product.nombre} loading="lazy" />
  }
  if (category === 'Papas') return <FriesSvg />
  if (category === 'Bebidas') return <DrinkSvg />
  if (category === 'Extras') return <ExtraSvg />
  return <BurgerSvg large={large} />
}
