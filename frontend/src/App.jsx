import { useEffect, useState } from 'react'
import CustomerView from './pages/CustomerView.jsx'
import KdsView from './pages/KdsView.jsx'

function currentRoute() {
  return window.location.hash.startsWith('#/kds') ? 'kds' : 'menu'
}

export default function App() {
  const [route, setRoute] = useState(currentRoute)

  useEffect(() => {
    const onChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route === 'kds' ? <KdsView /> : <CustomerView />
}
