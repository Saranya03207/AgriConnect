import { cn } from '@/lib/utils';

/**
 * WelcomeBanner – full-width greeting banner with gradient, used on all dashboards.
 */
export default function WelcomeBanner({ name, role, tagline, icon: Icon, gradient }) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white',
      gradient ?? 'bg-gradient-to-br from-primary via-emerald-600 to-teal-700',
    )}>
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      {/* Blob */}
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-6 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-white/70 text-sm font-medium">{role}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            Welcome back, {name}! 👋
          </h1>
          <p className="text-white/80 text-sm max-w-md">{tagline}</p>
        </div>
        {Icon && (
          <div className="hidden sm:flex w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center shrink-0">
            <Icon className="w-10 h-10 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
