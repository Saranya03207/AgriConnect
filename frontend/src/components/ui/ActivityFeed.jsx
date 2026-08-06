import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

/**
 * ActivityFeed – recent activity list for dashboards.
 * items: [{ icon: Icon, iconClass, title, subtitle, time, dotColor }]
 */
export default function ActivityFeed({ items = [], emptyText = 'No recent activity' }) {
  return (
    <div className="section-card p-5">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Recent Activity</h3>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
          <Clock className="w-8 h-8 opacity-30" />
          <p className="text-sm">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-border">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', item.iconClass ?? 'bg-primary/10 text-primary')}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{item.time}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
