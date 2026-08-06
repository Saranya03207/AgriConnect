import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

import { PageLoader } from '@/components/ui/PageLoader';





/**
 * RoleGuard – renders children only if the authenticated user's role
 * is in the allowed `roles` list. Otherwise redirects to /dashboard.
 */
export default function RoleGuard({ roles }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}