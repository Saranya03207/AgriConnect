import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/ui/StatsCard';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import QuickActions from '@/components/ui/QuickActions';
import ActivityFeed from '@/components/ui/ActivityFeed';
import { Wrench, Wallet, CalendarCheck, Star, Plus, List, MessageSquare, Settings, CheckCircle, Bell, Clock } from 'lucide-react';
import { ROUTES } from '@/constants';

const stats = [
  { title: 'Listed Equipment',  value: 6,        iconClass: 'stat-icon-blue',   icon: Wrench,        trend: { value: 1,  label: 'new this month' } },
  { title: 'Monthly Revenue',   value: '₹52,000', iconClass: 'stat-icon-green',  icon: Wallet,        trend: { value: 22, label: 'vs last month'  } },
  { title: 'Active Rentals',    value: 2,        iconClass: 'stat-icon-amber',  icon: CalendarCheck, trend: { value: 0,  label: 'same as last week' } },
  { title: 'Average Rating',   value: '4.9 ★',  iconClass: 'stat-icon-purple', icon: Star,          trend: { value: 3,  label: 'vs last month'  } },
];

const actions = [
  { label: 'Add Equipment', icon: Plus,          path: '/listings/create',      color: 'bg-blue-100 text-blue-600'   },
  { label: 'My Equipment', icon: List,           path: '/listings/my',          color: 'bg-cyan-100 text-cyan-600'   },
  { label: 'Rentals',      icon: CalendarCheck,  path: '/transactions/selling', color: 'bg-amber-100 text-amber-600' },
  { label: 'Messages',     icon: MessageSquare,  path: ROUTES.MESSAGES,         color: 'bg-violet-100 text-violet-600' },
];

const activity = [
  { icon: CheckCircle, iconClass: 'bg-emerald-100 text-emerald-600', title: 'Tractor rental completed',    subtitle: 'John Deere 5050 — 3 days, ₹3,600',   time: '2h ago'    },
  { icon: Bell,        iconClass: 'bg-amber-100   text-amber-600',   title: 'New rental request',         subtitle: 'Harvester — 5 days from Jun 18',     time: '5h ago'    },
  { icon: Settings,    iconClass: 'bg-blue-100    text-blue-600',    title: 'Maintenance scheduled',      subtitle: 'Rotavator — service due Jun 20',     time: 'Yesterday' },
];

export default function EquipmentDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <WelcomeBanner name={user?.displayName ?? 'User'} role="Equipment Owner Dashboard"
        tagline="Manage your machinery listings, track rentals, and maximise utilisation."
        icon={Wrench} gradient="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">{stats.map(s => <StatsCard key={s.title} {...s} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><QuickActions actions={actions} /></div>
        <div className="lg:col-span-2"><ActivityFeed items={activity} /></div>
      </div>
    </div>
  );
}
