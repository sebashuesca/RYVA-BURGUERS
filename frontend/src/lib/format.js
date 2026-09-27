const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })

export const money = (amount) => formatter.format(Number(amount || 0))

export const categoryNames = {
  1: 'Hamburguesas',
  2: 'Papas',
  3: 'Bebidas',
  4: 'Extras',
  5: 'Combos',
}

export function categoryName(id) {
  return categoryNames[id] || 'Especialidades'
}

export function timeLabel(value) {
  return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
