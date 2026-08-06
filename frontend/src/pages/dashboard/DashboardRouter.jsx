import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/PageLoader';

const roleDashboardMap = {
  [UserRole.FARMER]: '/dashboard/farmer',
  [UserRole.LABOUR_PROVIDER]: '/dashboard/labour',
  [UserRole.EQUIPMENT_OWNER]: '/dashboard/equipment',
  [UserRole.TRANSPORT_PROVIDER]: '/dashboard/transport',
  [UserRole.STORAGE_OWNER]: '/dashboard/storage',
  [UserRole.PROCESSING_UNIT]: '/dashboard/processing',
  [UserRole.INDUSTRY]: '/dashboard/industry',
  [UserRole.ADMIN]: '/admin'
};

export default function DashboardRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const target = roleDashboardMap[user.role] ?? '/';
  return <Navigate to={target} replace />;
}