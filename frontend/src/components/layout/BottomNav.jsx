import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, User, Bell, MessageSquare,
  Wheat, HardHat, Wrench, Truck, Warehouse,
  Factory, Building2, ShieldCheck,
} from 'lucide-react';

/* Role → dashboard path */
const roleDash = {
  farmer:             '/dashboard/farmer',
  labour_provider:    '/dashboard/labour',
  equipment_owner:    '/dashboard/equipment',
  transport_provider: '/dashboard/transport',
  storage_owner:      '/dashboard/storage',
  processing_unit:    '/dashboard/processing',
  industry:           '/dashboard/industry',
  admin:              '/admin',
};

/* Role → icon */
const roleIcon = {
  farmer:             Wheat,
  labour_provider:    HardHat,
  equipment_owner:    Wrench,
  transport_provider: Truck,
  storage_owner:      Warehouse,
  processing_unit:    Factory,
  industry:           Building2,
  admin:              ShieldCheck,
};

export function BottomNav() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const role = user?.role ?? 'farmer';
  const DashIcon = roleIcon[role] ?? LayoutDashboard;
  const dashPath = roleDash[role] ?? ROUTES.DASHBOARD;

  const items = [
    { icon: DashIcon,      label: 'Dashboard',      path: dashPath },
    { icon: MessageSquare, label: 'Messages',        path: ROUTES.MESSAGES },
    { icon: Bell,          label: 'Alerts',          path: ROUTES.NOTIFICATIONS, badge: unreadCount },
    { icon: User,          label: 'Profile',         path: ROUTES.PROFILE },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="grid grid-cols-4 h-[62px]">
        {items.map(({ icon: Icon, label, path, badge }) => {
          const isActive = location.pathname === path
            || (path !== '/' && location.pathname.startsWith(path));

          return (
            <Link key={path} to={path}
              className="relative flex flex-col items-center justify-center gap-1 transition-colors">

              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-b-full" />
              )}

              <div className={cn(
                'relative p-1.5 rounded-xl transition-all duration-200',
                isActive ? 'bg-primary/10 text-primary scale-110' : 'text-muted-foreground',
              )}>
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>

              <span className={cn(
                'text-[10px] font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
