import { useState } from 'react';
import { Menu, Bell, Search, ChevronDown, LogOut, User, Settings, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn, getInitials } from '@/lib/utils';
import { ROUTES } from '@/constants';

const roleColors = {
  farmer:             'bg-emerald-100 text-emerald-700',
  labour_provider:    'bg-amber-100  text-amber-700',
  equipment_owner:    'bg-blue-100   text-blue-700',
  transport_provider: 'bg-violet-100 text-violet-700',
  storage_owner:      'bg-cyan-100   text-cyan-700',
  processing_unit:    'bg-orange-100 text-orange-700',
  industry:           'bg-slate-100  text-slate-700',
  admin:              'bg-rose-100   text-rose-700',
};

export function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roleLabel = user?.role?.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') ?? '';
  const badgeClass = user?.role ? roleColors[user.role] : 'bg-muted text-muted-foreground';
  const initials = getInitials(user?.displayName || user?.email || 'U');

  const handleLogout = async () => {
    try { await logout(); navigate(ROUTES.HOME); }
    catch { /* ignore */ }
    finally { setDropdownOpen(false); }
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-4 lg:px-6 gap-3">

      {/* Mobile hamburger */}
      <button onClick={onMenuToggle}
        className="btn-ghost p-2 -ml-1 lg:hidden shrink-0">
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile logo */}
      <Link to={ROUTES.DASHBOARD} className="lg:hidden flex items-center gap-2 text-primary font-extrabold text-lg shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-black">AC</span>
        </div>
        AgriConnect
      </Link>

      {/* ── Search bar (desktop) ── */}
      <div className="hidden lg:flex flex-1 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search listings, users…"
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-input bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* ── Mobile search toggle ── */}
      <button onClick={() => setSearchOpen(v => !v)}
        className="btn-ghost p-2 lg:hidden shrink-0 ml-auto">
        {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
      </button>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="absolute top-16 left-0 right-0 bg-card border-b border-border p-3 z-50 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input autoFocus type="text" placeholder="Search listings, users…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-input bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 ml-auto lg:ml-0">
        {/* Notification bell */}
        <Link to={ROUTES.NOTIFICATIONS}
          className="relative btn-ghost p-2 rounded-xl">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* ── User menu ── */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className={cn(
              'flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl border border-transparent',
              'hover:bg-secondary hover:border-border transition-all duration-150',
              dropdownOpen && 'bg-secondary border-border',
            )}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none gap-1">
              <span className="text-sm font-semibold text-foreground">{user?.displayName || 'User'}</span>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', badgeClass)}>
                {roleLabel}
              </span>
            </div>
            <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground hidden sm:block transition-transform duration-200', dropdownOpen && 'rotate-180')} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm text-foreground">{user?.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                {/* Links */}
                <div className="py-1.5">
                  <Link to={ROUTES.PROFILE} onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                    <User className="w-4 h-4 text-muted-foreground" />
                    My Profile
                  </Link>
                  <Link to={ROUTES.SETTINGS} onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Settings
                  </Link>
                </div>
                <div className="py-1.5 border-t border-border">
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
