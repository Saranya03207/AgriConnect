import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/ui/StatsCard';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import QuickActions from '@/components/ui/QuickActions';
import ActivityFeed from '@/components/ui/ActivityFeed';
import { Factory, Wallet, Package, Star, Plus, List, MessageSquare, Zap, CheckCircle, Bell, BarChart3 } from 'lucide-react';
import { ROUTES } from '@/constants';

const stats = [
  { title: 'Processing Services', value: 5,        iconClass: 'stat-icon-orange', icon: Factory,   trend: { value: 1,  label: 'new this month' } },
  { title: 'Monthly Revenue',     value: '₹75,000', iconClass: 'stat-icon-green',  icon: Wallet,    trend: { value: 16, label: 'vs last month'  } },
  { title: 'Orders This Month',   value: 22,       iconClass: 'stat-icon-blue',   icon: Package,   trend: { value: 5,  label: 'vs last month'  } },
  { title: 'Average Rating',     value: '4.8 ★',  iconClass: 'stat-icon-purple', icon: Star,      trend: { value: 1,  label: 'vs last month'  } },
];

const actions = [
  { label: 'Add Service',   icon: Plus,         path: '/listings/create',      color: 'bg-orange-100 text-orange-600' },
  { label: 'My Services',  icon: List,         path: '/listings/my',          color: 'bg-amber-100 text-amber-600'   },
  { label: 'Orders',       icon: Package,      path: '/transactions/selling', color: 'bg-blue-100 text-blue-600'     },
  { label: 'Messages',     icon: MessageSquare, path: ROUTES.MESSAGES,        color: 'bg-violet-100 text-violet-600' },
];

const activity = [
  { icon: CheckCircle, iconClass: 'bg-emerald-100 text-emerald-600', title: 'Milling order completed',    subtitle: '50 ton wheat → flour, Agra Mill',    time: '2h ago'    },
  { icon: Bell,        iconClass: 'bg-amber-100   text-amber-600',   title: 'New processing request',    subtitle: 'Rice dehusking — 200 MT, urgent',    time: '5h ago'    },
  { icon: Zap,         iconClass: 'bg-orange-100  text-orange-600',  title: 'Capacity upgraded',         subtitle: 'New mill unit operational from today', time: 'Yesterday' },
];

export default function ProcessingDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <WelcomeBanner name={user?.displayName ?? 'User'} role="Processing Unit Dashboard"
        tagline="Manage processing services, handle bulk orders, and expand your value chain."
        icon={Factory} gradient="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">{stats.map(s => <StatsCard key={s.title} {...s} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><QuickActions actions={actions} /></div>
        <div className="lg:col-span-2"><ActivityFeed items={activity} /></div>
      </div>
    </div>
  );
}
