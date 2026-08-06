import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/ui/StatsCard';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import QuickActions from '@/components/ui/QuickActions';
import ActivityFeed from '@/components/ui/ActivityFeed';
import {
  Wheat, Wallet, Package, Star,
  Plus, ShoppingBag, MessageSquare, Bot,
  TrendingUp, CheckCircle, Clock, Bell,
} from 'lucide-react';
import { ROUTES } from '@/constants';

const stats = [
  { title: 'Active Listings',  value: 12,      iconClass: 'stat-icon-green',  icon: Wheat,      trend: { value: 8,  label: 'vs last month' } },
  { title: 'Total Revenue',    value: '₹45,200', iconClass: 'stat-icon-amber',  icon: Wallet,     trend: { value: 14, label: 'vs last month' } },
  { title: 'Pending Orders',   value: 3,        iconClass: 'stat-icon-blue',   icon: Package,    trend: { value: -1, label: 'vs last week'  } },
  { title: 'Average Rating',   value: '4.8 ★',  iconClass: 'stat-icon-purple', icon: Star,       trend: { value: 2,  label: 'vs last month' } },
];

const actions = [
  { label: 'New Listing',    icon: Plus,         path: '/listings/create',      color: 'bg-emerald-100 text-emerald-600' },
  { label: 'My Listings',   icon: Wheat,        path: '/listings/my',          color: 'bg-lime-100 text-lime-600' },
  { label: 'Orders',        icon: ShoppingBag,  path: '/transactions/selling', color: 'bg-blue-100 text-blue-600' },
  { label: 'AI Advisor',    icon: Bot,          path: ROUTES.AI_ADVISOR,       color: 'bg-violet-100 text-violet-600' },
];

const activity = [
  { icon: CheckCircle, iconClass: 'bg-emerald-100 text-emerald-600', title: 'Order #1042 Completed',      subtitle: 'Wheat — 500 kg to Mehta Traders',   time: '2h ago'  },
  { icon: Bell,        iconClass: 'bg-amber-100   text-amber-600',   title: 'New offer on Paddy listing', subtitle: '₹22/kg — from Sunrise Mills',       time: '4h ago'  },
  { icon: Package,     iconClass: 'bg-blue-100    text-blue-600',    title: 'Listing "Rice Paddy" live',  subtitle: '1,000 kg available',                time: 'Yesterday' },
  { icon: TrendingUp,  iconClass: 'bg-violet-100  text-violet-600',  title: 'Price alert: Maize +12%',   subtitle: 'Market price update from APMC',     time: '2d ago'  },
];

export default function FarmerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <WelcomeBanner
        name={user?.displayName ?? 'Farmer'}
        role="Farmer Dashboard"
        tagline="Manage your listings, track orders, and access AI-powered crop insights."
        icon={Wheat}
        gradient="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {stats.map(s => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      {/* Quick actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QuickActions actions={actions} />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed items={activity} />
        </div>
      </div>

      {/* Upcoming tasks */}
      <div className="section-card p-5">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Upcoming</h3>
        <div className="space-y-3">
          {[
            { label: 'Renew Wheat listing — expires in 3 days',   color: 'bg-amber-500'  },
            { label: 'Respond to 2 pending offers',               color: 'bg-blue-500'   },
            { label: 'Upload harvest photos for Rice Paddy',      color: 'bg-emerald-500'},
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/60">
              <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
              <span className="text-sm text-foreground">{label}</span>
              <Clock className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
