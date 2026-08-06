import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/ui/StatsCard';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import QuickActions from '@/components/ui/QuickActions';
import ActivityFeed from '@/components/ui/ActivityFeed';
import { Warehouse, Wallet, PackageCheck, Star, Plus, List, MessageSquare, Thermometer, CheckCircle, Bell, BarChart3 } from 'lucide-react';
import { ROUTES } from '@/constants';

const stats = [
  { title: 'Total Capacity',    value: '2,400 MT', iconClass: 'stat-icon-cyan',   icon: Warehouse,     trend: { value: 0,  label: 'unchanged'     } },
  { title: 'Occupied (%)',      value: '87%',      iconClass: 'stat-icon-amber',  icon: BarChart3,     trend: { value: 12, label: 'vs last month'  } },
  { title: 'Monthly Revenue',   value: '₹62,000',  iconClass: 'stat-icon-green',  icon: Wallet,        trend: { value: 9,  label: 'vs last month'  } },
  { title: 'Average Rating',   value: '4.9 ★',    iconClass: 'stat-icon-purple', icon: Star,          trend: { value: 2,  label: 'vs last month'  } },
];

const actions = [
  { label: 'Add Facility',  icon: Plus,         path: '/listings/create',      color: 'bg-cyan-100 text-cyan-600'     },
  { label: 'My Facilities', icon: List,         path: '/listings/my',          color: 'bg-teal-100 text-teal-600'     },
  { label: 'Bookings',      icon: PackageCheck, path: '/transactions/selling', color: 'bg-blue-100 text-blue-600'     },
  { label: 'Messages',      icon: MessageSquare, path: ROUTES.MESSAGES,        color: 'bg-violet-100 text-violet-600' },
];

const activity = [
  { icon: CheckCircle,    iconClass: 'bg-emerald-100 text-emerald-600', title: 'Booking confirmed',           subtitle: 'Bay C3 — 300 MT wheat, 3 months',     time: '1h ago'    },
  { icon: Bell,           iconClass: 'bg-amber-100   text-amber-600',   title: 'New booking request',        subtitle: '200 MT cold storage — rice',          time: '4h ago'    },
  { icon: Thermometer,    iconClass: 'bg-cyan-100    text-cyan-600',    title: 'Temperature alert resolved', subtitle: 'Bay A1 back to optimal 8°C',          time: 'Yesterday' },
];

export default function StorageDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <WelcomeBanner name={user?.displayName ?? 'User'} role="Storage Owner Dashboard"
        tagline="Manage your cold storage and warehouse facilities, track occupancy and bookings."
        icon={Warehouse} gradient="bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">{stats.map(s => <StatsCard key={s.title} {...s} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><QuickActions actions={actions} /></div>
        <div className="lg:col-span-2"><ActivityFeed items={activity} /></div>
      </div>
    </div>
  );
}
