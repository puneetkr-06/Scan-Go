import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../contexts/StoreContext'

export function StoreGate({ children }) {
  const { selectedStore } = useStore()
  const location = useLocation()

  if (!selectedStore?.id) {
    return <Navigate to="/stores" state={{ from: location }} replace />
  }

  return children
}
