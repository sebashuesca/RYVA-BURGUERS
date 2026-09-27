// Coincide con la regla del servidor; allí se decide la URL que se guarda.
const images = {
  burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  drinks: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  sides: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80',
  desserts: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
  general: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
}

export function defaultImageForCategory(name = '') {
  const category = name.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (category.includes('hamburgues') || category.includes('burger')) return images.burgers
  if (category.includes('bebida')) return images.drinks
  if (category.includes('postre') || category.includes('dessert')) return images.desserts
  if (['complement', 'acompan', 'papa', 'extra', 'guarnicion'].some((word) => category.includes(word))) return images.sides
  return images.general
}
