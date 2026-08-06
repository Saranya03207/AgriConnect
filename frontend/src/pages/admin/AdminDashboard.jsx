import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import { Users, Package, Activity, Wallet, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.displayName ?? 'User'}!`}
        description="Platform Administration" />
      

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={1250} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Active Listings" value={450} icon={<Package className="h-5 w-5" />} />
        <StatsCard title="Transactions" value={890} icon={<Activity className="h-5 w-5" />} />
        <StatsCard title="Revenue" value={450000} icon={<Wallet className="h-5 w-5" />} />
      </div>

      {/* Coming Soon */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Coming Soon</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• User moderation</li>
          <li>• Platform analytics</li>
          <li>• System health monitoring</li>
        </ul>
      </div>
    </div>);

}