import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '@/app/context'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Route protection guard.
 * Allows access if:
 * 1. User is authenticated (currentUser is present)
 * 2. OR User is in Demo Mode (for offline preview/judging)
 * Otherwise redirects to /login preserving intended path.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, isDemoMode } = useApp()
  const location = useLocation()

  if (!currentUser && !isDemoMode) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
