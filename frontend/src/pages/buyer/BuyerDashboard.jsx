import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import { ShoppingBag, Clock, CheckCircle, Heart } from 'lucide-react';

/** BuyerDashboard – Phase 2/3 full implementation */
export default function BuyerDashboard() {
  return (
    <div>
      <PageHeader title="Buyer Dashboard" description="Your purchases and activity" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Orders" value="—" icon={<ShoppingBag className="h-5 w-5" />} />
        <StatsCard title="Pending Offers" value="—" icon={<Clock className="h-5 w-5" />} />
        <StatsCard title="Completed" value="—" icon={<CheckCircle className="h-5 w-5" />} />
        <StatsCard title="Saved Listings" value="—" icon={<Heart className="h-5 w-5" />} />
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Full dashboard coming in Phase 2/3.</p>
    </div>);

}