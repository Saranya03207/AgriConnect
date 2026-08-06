import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/ui/StatsCard';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import QuickActions from '@/components/ui/QuickActions';
import ActivityFeed from '@/components/ui/ActivityFeed';
import { Building2, Wallet, ShoppingCart, TrendingUp, Plus, List, MessageSquare, BarChart3, CheckCircle, Bell, Package } from 'lucide-react';
import { ROUTES } from '@/constants';

const stats = [
  { title: 'Active Demands',    value: 8,         iconClass: 'stat-icon-blue',   icon: Building2,    trend: { value: 3,  label: 'new this month' } },
  { title: 'Total Purchased',   value: '₹4.2L',   iconClass: 'stat-icon-green',  icon: Wallet,       trend: { value: 24, label: 'vs last month'  } },
  { title: 'Pending Orders',    value: 5,         iconClass: 'stat-icon-amber',  icon: ShoppingCart, trend: { value: 2,  label: 'vs last week'   } },
  { title: 'Suppliers',         value: 34,        iconClass: 'stat-icon-purple', icon: TrendingUp,   trend: { value: 6,  label: 'new this month' } },
];

const actions = [
  { label: 'Post Demand',    icon: Plus,         path: '/demands/create',       color: 'bg-slate-100 text-slate-600'   },
  { label: 'My Demands',    icon: List,         path: '/demands/my',           color: 'bg-blue-100 text-blue-600'     },
  { label: 'Orders',        icon: Package,      path: '/transactions/buying',  color: 'bg-emerald-100 text-emerald-600'},
  { label: 'Analytics',     icon: BarChart3,    path: '/analytics',            color: 'bg-violet-100 text-violet-600' },
];

const activity = [
  { icon: CheckCircle, iconClass: 'bg-emerald-100 text-emerald-600', title: 'Bulk order fulfilled',       subtitle: '500 MT wheat delivered — Patel Farms',  time: '1h ago'    },
  { icon: Bell,        iconClass: 'bg-amber-100   text-amber-600',   title: 'New supplier matched',      subtitle: 'Rice paddy demand — 3 suppliers found', time: '3h ago'    },
  { icon: BarChart3,   iconClass: 'bg-blue-100    text-blue-600',    title: 'Market insight available',  subtitle: 'Wheat price forecast for July 2026',    time: 'Yesterday' },
];

export default function IndustryDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <WelcomeBanner name={user?.displayName ?? 'User'} role="Industry Dashboard"
        tagline="Source quality agri-produce in bulk, manage suppliers, and track procurement."
        icon={Building2} gradient="bg-gradient-to-br from-slate-600 via-gray-700 to-zinc-800" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">{stats.map(s => <StatsCard key={s.title} {...s} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><QuickActions actions={actions} /></div>
        <div className="lg:col-span-2"><ActivityFeed items={activity} /></div>
      </div>
    </div>
  );
}
