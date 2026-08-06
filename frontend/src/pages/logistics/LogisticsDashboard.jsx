import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import { Truck, MapPin, CheckCircle, DollarSign } from 'lucide-react';

/** LogisticsDashboard – Phase 6 full implementation */
export default function LogisticsDashboard() {
  return (
    <div>
      <PageHeader title="Logistics Dashboard" description="Your delivery jobs and earnings" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Available Jobs" value="—" icon={<Truck className="h-5 w-5" />} />
        <StatsCard title="Active Deliveries" value="—" icon={<MapPin className="h-5 w-5" />} />
        <StatsCard title="Completed" value="—" icon={<CheckCircle className="h-5 w-5" />} />
        <StatsCard title="Earnings" value="—" icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Full dashboard coming in Phase 6.</p>
    </div>);

}