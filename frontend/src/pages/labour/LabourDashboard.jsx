import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/ui/StatsCard';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import QuickActions from '@/components/ui/QuickActions';
import ActivityFeed from '@/components/ui/ActivityFeed';
import { HardHat, Wallet, CalendarCheck, Star, Plus, List, MessageSquare, MapPin, CheckCircle, Bell, Clock } from 'lucide-react';
import { ROUTES } from '@/constants';

const stats = [
  { title: 'Active Services',   value: 4,        iconClass: 'stat-icon-amber',  icon: HardHat,       trend: { value: 2,  label: 'new this week' } },
  { title: 'Monthly Earnings',  value: '₹28,500', iconClass: 'stat-icon-green',  icon: Wallet,        trend: { value: 18, label: 'vs last month' } },
  { title: 'Bookings This Month',value: 9,        iconClass: 'stat-icon-blue',   icon: CalendarCheck, trend: { value: 3,  label: 'vs last month' } },
  { title: 'Average Rating',    value: '4.7 ★',  iconClass: 'stat-icon-purple', icon: Star,          trend: { value: 1,  label: 'vs last month' } },
];

const actions = [
  { label: 'Add Service',    icon: Plus,         path: '/listings/create', color: 'bg-amber-100 text-amber-600'   },
  { label: 'My Services',   icon: List,         path: '/listings/my',    color: 'bg-lime-100 text-lime-600'     },
  { label: 'Bookings',      icon: CalendarCheck, path: '/transactions/selling', color: 'bg-blue-100 text-blue-600' },
  { label: 'Messages',      icon: MessageSquare, path: ROUTES.MESSAGES,   color: 'bg-violet-100 text-violet-600' },
];

const activity = [
  { icon: CheckCircle, iconClass: 'bg-emerald-100 text-emerald-600', title: 'Booking Confirmed',       subtitle: 'Paddy harvesting — Rajan Farm, 15 Jun',  time: '1h ago'  },
  { icon: Bell,        iconClass: 'bg-amber-100   text-amber-600',   title: 'New Booking Request',    subtitle: 'Wheat threshing — 3 days',               time: '3h ago'  },
  { icon: MapPin,      iconClass: 'bg-blue-100    text-blue-600',    title: 'Job location updated',   subtitle: 'Patiala → Ludhiana district',            time: 'Yesterday' },
];

export default function LabourDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <WelcomeBanner name={user?.displayName ?? 'User'} role="Labour Provider Dashboard"
        tagline="Offer your skills, manage bookings, and grow your agricultural labour business."
        icon={HardHat} gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">{stats.map(s => <StatsCard key={s.title} {...s} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><QuickActions actions={actions} /></div>
        <div className="lg:col-span-2"><ActivityFeed items={activity} /></div>
      </div>
    </div>
  );
}
