import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" />

  return children
}

export default ProtectedRoute