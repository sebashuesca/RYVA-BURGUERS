import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

export const api = axios.create({ baseURL, timeout: 15000 })

export function apiMessage(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(' · ')
  if (error?.code === 'ECONNABORTED') return 'La conexión tardó demasiado. Intenta de nuevo.'
  if (!error?.response) return 'No pudimos conectar con la cocina. Revisa la conexión.'
  return 'Ocurrió un problema. Intenta de nuevo.'
}
