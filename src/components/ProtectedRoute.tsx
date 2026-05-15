import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

type ProtectedRouteProps = {
  session: unknown | null
  children: ReactNode
}

function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default ProtectedRoute