import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

type ProtectedRouteProps = {
  session: unknown | null
  children: ReactNode
  redirectTo?: string
}

function ProtectedRoute({ session, children, redirectTo = '/login' }: ProtectedRouteProps) {
  if (!session) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default ProtectedRoute