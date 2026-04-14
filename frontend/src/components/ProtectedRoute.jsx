import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }) {
  const { session, loading, isConfigured } = useAuth()
  const location = useLocation()

  if (!isConfigured) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-stone-500">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#3d9a1f] border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
