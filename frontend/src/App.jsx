import { useEffect, useState } from 'react'
import CustomerView from './pages/CustomerView.jsx'
import KdsView from './pages/KdsView.jsx'
import AdminView from './pages/AdminView.jsx'

function currentRoute() {
  if (window.location.hash.startsWith('#/admin')) return 'admin'
  return window.location.hash.startsWith('#/kds') ? 'kds' : 'menu'
}

export default function App() {
  const [route, setRoute] = useState(currentRoute)

  useEffect(() => {
    const onChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  if (route === 'admin') return <AdminView />
  return route === 'kds' ? <KdsView /> : <CustomerView />
}
