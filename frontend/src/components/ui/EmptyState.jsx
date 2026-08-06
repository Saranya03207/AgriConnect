import { cn } from '@/lib/utils';










export default function EmptyState({
  icon,
  title,
  description,
  action,
  className
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}>
      
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description &&
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      }
      {action && <div className="mt-6">{action}</div>}
    </div>);

}