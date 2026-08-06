import { cn } from '@/lib/utils';







const statusStyles = {
  active: 'bg-green-100 text-green-800',
  open: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  fulfilled: 'bg-green-100 text-green-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_delivery: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-blue-100 text-blue-800',
  assigned: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-cyan-100 text-cyan-800',
  pending: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-600',
  expired: 'bg-gray-100 text-gray-600',
  sold: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-700',
  removed: 'bg-red-100 text-red-700',
  failed: 'bg-red-100 text-red-700',
  suspended: 'bg-red-100 text-red-700',
  disputed: 'bg-orange-100 text-orange-700'
};

const statusLabels = {
  active: 'Active',
  open: 'Open',
  sold: 'Sold',
  expired: 'Expired',
  draft: 'Draft',
  removed: 'Removed',
  pending: 'Pending',
  accepted: 'Accepted',
  in_delivery: 'In Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  fulfilled: 'Fulfilled',
  suspended: 'Suspended'
};






export default function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status] ?? 'bg-gray-100 text-gray-600',
        className
      )}>
      
      {statusLabels[status] ?? status}
    </span>);

}