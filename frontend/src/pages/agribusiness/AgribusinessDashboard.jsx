import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import { ClipboardList, TrendingUp, Package, Users } from 'lucide-react';

/** AgribusinessDashboard – Phase 2/11 full implementation */
export default function AgribusinessDashboard() {
  return (
    <div>
      <PageHeader title="Agribusiness Dashboard" description="Supply analytics and procurement overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Open Demands" value="—" icon={<ClipboardList className="h-5 w-5" />} />
        <StatsCard title="Active Orders" value="—" icon={<Package className="h-5 w-5" />} />
        <StatsCard title="Suppliers" value="—" icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Market Trend" value="—" icon={<TrendingUp className="h-5 w-5" />} />
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Full dashboard coming in Phase 2/11.</p>
    </div>);

}