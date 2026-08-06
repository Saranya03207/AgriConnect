import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageLoader } from '@/components/ui/PageLoader';

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);
  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {mobileOpen &&
      <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeMobile} />
          <div className="fixed inset-y-0 left-0 w-64 transform transition-transform duration-300 ease-in-out">
            <Sidebar collapsed={false} onToggle={closeMobile} />
          </div>
        </div>
      }
      
      {/* Main content */}
      <div className={cn('transition-all duration-300 ease-in-out min-h-screen flex flex-col', collapsed ? 'lg:ml-20' : 'lg:ml-64')}>
        <Topbar onMenuToggle={toggleMobile} />
        <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
      
      <BottomNav />
    </div>);

}