import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatsCard – dashboard metric card with optional trend indicator.
 *
 * @param {string} title
 * @param {string|number} value
 * @param {ReactNode} icon
 * @param {string} iconClass  – one of stat-icon-* utility classes
 * @param {{ value: number, label: string }} [trend]
 * @param {string} [className]
 */
export default function StatsCard({ title, value, icon: Icon, iconClass, trend, className }) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div className={cn('section-card p-5 flex flex-col gap-4 animate-fade-in', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground leading-tight">{title}</p>
        {Icon && (
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
            iconClass ?? 'stat-icon-green',
          )}>
            <span className="[&>svg]:w-5 [&>svg]:h-5"><Icon /></span>
          </div>
        )}
      </div>

      <p className="text-3xl font-extrabold tracking-tight text-foreground">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {trend && (
        <div className={cn(
          'flex items-center gap-1.5 text-xs font-semibold',
          isPositive ? 'text-emerald-600' : 'text-red-500',
        )}>
          {isPositive
            ? <TrendingUp className="w-3.5 h-3.5" />
            : <TrendingDown className="w-3.5 h-3.5" />
          }
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </div>
  );
}
