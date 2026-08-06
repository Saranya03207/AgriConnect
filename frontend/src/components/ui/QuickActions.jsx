import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * QuickActions – horizontal action button strip for dashboards.
 * actions: [{ label, icon: Icon, path, color }]
 */
export default function QuickActions({ actions }) {
  return (
    <div className="section-card p-5">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map(({ label, icon: Icon, path, color }) => (
          <Link key={label} to={path}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent',
              'hover:border-border hover:shadow-sm transition-all duration-150 text-center group',
              'bg-secondary/50 hover:bg-card',
            )}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color ?? 'bg-primary/10 text-primary')}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-foreground leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
