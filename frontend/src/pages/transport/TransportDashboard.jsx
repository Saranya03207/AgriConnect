import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/ui/StatsCard';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import QuickActions from '@/components/ui/QuickActions';
import ActivityFeed from '@/components/ui/ActivityFeed';
import { Truck, Wallet, MapPin, Star, Plus, List, MessageSquare, Navigation, CheckCircle, Bell, Clock } from 'lucide-react';
import { ROUTES } from '@/constants';

const stats = [
  { title: 'Active Routes',     value: 3,        iconClass: 'stat-icon-purple', icon: Truck,     trend: { value: 1,  label: 'new this week'  } },
  { title: 'Monthly Earnings',  value: '₹38,000', iconClass: 'stat-icon-green',  icon: Wallet,    trend: { value: 11, label: 'vs last month'  } },
  { title: 'Trips This Month',  value: 14,       iconClass: 'stat-icon-blue',   icon: MapPin,    trend: { value: 4,  label: 'vs last month'  } },
  { title: 'Average Rating',   value: '4.6 ★',  iconClass: 'stat-icon-amber',  icon: Star,      trend: { value: 2,  label: 'vs last month'  } },
];

const actions = [
  { label: 'Add Route',    icon: Plus,         path: '/listings/create',    color: 'bg-violet-100 text-violet-600' },
  { label: 'My Routes',   icon: List,         path: '/listings/my',        color: 'bg-purple-100 text-purple-600' },
  { label: 'Deliveries',  icon: Navigation,   path: '/deliveries/active',  color: 'bg-blue-100 text-blue-600'    },
  { label: 'Messages',    icon: MessageSquare, path: ROUTES.MESSAGES,       color: 'bg-cyan-100 text-cyan-600'    },
];

const activity = [
  { icon: CheckCircle, iconClass: 'bg-emerald-100 text-emerald-600', title: 'Delivery #308 completed',    subtitle: 'Amritsar → Delhi, 12 ton wheat',     time: '3h ago'    },
  { icon: Bell,        iconClass: 'bg-amber-100   text-amber-600',   title: 'New delivery request',      subtitle: 'Ludhiana → Mumbai, 8 ton rice',      time: '6h ago'    },
  { icon: MapPin,      iconClass: 'bg-violet-100  text-violet-600',  title: 'Route updated',             subtitle: 'Punjab → Haryana corridor',          time: 'Yesterday' },
];

export default function TransportDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <WelcomeBanner name={user?.displayName ?? 'User'} role="Transport Provider Dashboard"
        tagline="Manage routes, accept deliveries, and grow your logistics network."
        icon={Truck} gradient="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">{stats.map(s => <StatsCard key={s.title} {...s} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><QuickActions actions={actions} /></div>
        <div className="lg:col-span-2"><ActivityFeed items={activity} /></div>
      </div>
    </div>
  );
}
