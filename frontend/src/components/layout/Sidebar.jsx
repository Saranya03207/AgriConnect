import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';
import { cn, getInitials } from '@/lib/utils';
import {
  Sprout, LayoutDashboard, User, Bell, Settings2,
  Users, Package, BarChart3, LogOut,
  ChevronLeft, ChevronRight,
  Wheat, Wrench, Truck, Warehouse, Factory,
  Building2, HardHat, MessageSquare,
} from 'lucide-react';

/* ── Per-role nav links ─────────────────────────────────────────── */
const roleLinks = {
  farmer: [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard/farmer' },
    { icon: Wheat,           label: 'My Listings',  path: '/listings/my' },
    { icon: Package,         label: 'Orders',       path: '/transactions/selling' },
    { icon: MessageSquare,   label: 'Messages',     path: ROUTES.MESSAGES },
  ],
  labour_provider: [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard/labour' },
    { icon: HardHat,         label: 'My Services',  path: '/listings/my' },
    { icon: Package,         label: 'Bookings',     path: '/transactions/selling' },
    { icon: MessageSquare,   label: 'Messages',     path: ROUTES.MESSAGES },
  ],
  equipment_owner: [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard/equipment' },
    { icon: Wrench,          label: 'Equipment',    path: '/listings/my' },
    { icon: Package,         label: 'Rentals',      path: '/transactions/selling' },
    { icon: MessageSquare,   label: 'Messages',     path: ROUTES.MESSAGES },
  ],
  transport_provider: [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard/transport' },
    { icon: Truck,           label: 'My Routes',    path: '/listings/my' },
    { icon: Package,         label: 'Deliveries',   path: '/deliveries/active' },
    { icon: MessageSquare,   label: 'Messages',     path: ROUTES.MESSAGES },
  ],
  storage_owner: [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard/storage' },
    { icon: Warehouse,       label: 'Facilities',   path: '/listings/my' },
    { icon: Package,         label: 'Bookings',     path: '/transactions/selling' },
    { icon: MessageSquare,   label: 'Messages',     path: ROUTES.MESSAGES },
  ],
  processing_unit: [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard/processing' },
    { icon: Factory,         label: 'Services',     path: '/listings/my' },
    { icon: Package,         label: 'Orders',       path: '/transactions/selling' },
    { icon: MessageSquare,   label: 'Messages',     path: ROUTES.MESSAGES },
  ],
  industry: [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard/industry' },
    { icon: Building2,       label: 'Procurement',  path: '/demands/my' },
    { icon: Package,         label: 'Orders',       path: '/transactions/buying' },
    { icon: MessageSquare,   label: 'Messages',     path: ROUTES.MESSAGES },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Overview',     path: '/admin' },
    { icon: Users,           label: 'Users',        path: '/admin/users' },
    { icon: Package,         label: 'Listings',     path: '/admin/listings' },
    { icon: BarChart3,       label: 'Reports',      path: '/admin/reports' },
  ],
};

/* Shared bottom links */
const sharedLinks = [
  { icon: User,     label: 'Profile',       path: ROUTES.PROFILE },
  { icon: Bell,     label: 'Notifications', path: ROUTES.NOTIFICATIONS },
  { icon: Settings2,label: 'Settings',      path: ROUTES.SETTINGS },
];

const roleBadgeColor = {
  farmer:             'bg-emerald-100 text-emerald-700',
  labour_provider:    'bg-amber-100 text-amber-700',
  equipment_owner:    'bg-blue-100 text-blue-700',
  transport_provider: 'bg-violet-100 text-violet-700',
  storage_owner:      'bg-cyan-100 text-cyan-700',
  processing_unit:    'bg-orange-100 text-orange-700',
  industry:           'bg-slate-100 text-slate-700',
  admin:              'bg-rose-100 text-rose-700',
};

export function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role ?? 'farmer';
  const mainLinks = roleLinks[role] ?? roleLinks.farmer;
  const badgeClass = roleBadgeColor[role] ?? 'bg-muted text-muted-foreground';
  const roleLabel = role.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  const handleLogout = async () => {
    try { await logout(); navigate(ROUTES.HOME); }
    catch { /* ignore */ }
  };

  const NavItem = ({ link }) => {
    const Icon = link.icon;
    const isActive = location.pathname === link.path
      || (link.path !== '/dashboard' && location.pathname.startsWith(link.path));

    return (
      <Link
        to={link.path}
        title={collapsed ? link.label : undefined}
        className={cn(
          'nav-link',
          isActive && 'nav-link-active',
          collapsed && 'justify-center px-0',
        )}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{link.label}</span>}
      </Link>
    );
  };

  return (
    <div className={cn(
      'bg-card border-r border-border h-full flex flex-col transition-[width] duration-300 ease-in-out overflow-hidden',
      collapsed ? 'w-20' : 'w-64',
    )}>

      {/* ── Logo ── */}
      <div className="h-16 px-4 flex items-center justify-between shrink-0 border-b border-border">
        <Link
          to={ROUTES.DASHBOARD}
          className={cn('flex items-center gap-2.5 text-primary font-extrabold overflow-hidden', collapsed && 'w-10 justify-center')}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg whitespace-nowrap tracking-tight">AgriConnect</span>}
        </Link>

        {!collapsed && (
          <button onClick={onToggle} className="btn-ghost p-1.5 hidden lg:flex">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Scroll area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col gap-0.5 px-3">

        {collapsed && (
          <button onClick={onToggle} className="btn-ghost p-1.5 mx-auto mb-3 hidden lg:flex">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Main role links */}
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
            Main
          </p>
        )}
        {mainLinks.map(link => <NavItem key={link.path} link={link} />)}

        {/* Divider */}
        <div className="my-3 h-px bg-border mx-2" />

        {/* Shared links */}
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
            Account
          </p>
        )}
        {sharedLinks.map(link => <NavItem key={link.path} link={link} />)}
      </div>

      {/* ── User footer ── */}
      <div className="p-3 border-t border-border shrink-0 space-y-2">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
              {getInitials(user.displayName || user.email || 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate leading-none mb-1">
                {user.displayName || 'User'}
              </p>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', badgeClass)}>
                {roleLabel}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm font-medium',
            'text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30',
            'transition-all duration-150',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}
