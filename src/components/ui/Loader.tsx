import { cn } from '@/lib/utils';

export function Loader({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-ink-700 border-t-ember-500', sizes[size])} />
    </div>
  );
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-ink-700 border-t-ember-500" />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-ink-700 border-b-gold-500" style={{ animationDirection: 'reverse' }} />
      </div>
      <p className="text-sm text-ink-300">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-700/50 bg-ink-900">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex items-center justify-between pt-2">
          <div className="skeleton h-6 w-16 rounded" />
          <div className="skeleton h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-ink-700/50 bg-ink-900 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ember-500/10">
        <svg className="h-7 w-7 text-ember-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-cream-100">Something went wrong</h3>
        <p className="mt-1 text-sm text-ink-300">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-xl bg-ember-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-ember-600"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-ink-600 bg-ink-900/50 px-6 py-16 text-center">
      {icon && <div className="text-ink-400">{icon}</div>}
      <div>
        <h3 className="text-lg font-semibold text-cream-100">{title}</h3>
        {message && <p className="mt-1 text-sm text-ink-300">{message}</p>}
      </div>
      {action}
    </div>
  );
}
