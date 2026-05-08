import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" />
 
  if(role === 'admin' && window.location.pathname === '/dashboard'){
    return <Navigate to="/admin"/>
  }

  if(role === 'employee' && window.location.pathname === '/admin'){
    return <Navigate to="/dashboard"/>
  }if(allowedRoles && !allowedRoles.includes(role)){
    return <Navigate to ="/login"/>
  }

  return children
}

export default ProtectedRoute