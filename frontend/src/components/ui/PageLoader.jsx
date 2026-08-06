import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';






export function PageLoader({ className, label }) {
  return (
    <div
      className={cn(
        'flex min-h-screen items-center justify-center flex-col gap-3',
        className
      )}
      role="status"
      aria-label={label ?? 'Loading…'}>
      
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>);

}