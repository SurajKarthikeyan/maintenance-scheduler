import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  // Not logged in — redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  // Admin only route but user is not admin
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}