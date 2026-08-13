import { cn } from '@/lib/utils';
import { Flame, Star, Award, TrendingUp } from 'lucide-react';

interface BadgeProps {
  variant?: 'bestseller' | 'featured' | 'spicy' | 'discount' | 'new' | 'unavailable';
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ variant = 'featured', className, children }: BadgeProps) {
  const styles = {
    bestseller: 'bg-ember-500 text-ink-950',
    featured: 'bg-gold-500 text-ink-950',
    spicy: 'bg-red-600 text-white',
    discount: 'bg-emerald-500 text-ink-950',
    new: 'bg-blue-500 text-white',
    unavailable: 'bg-ink-600 text-ink-300',
  };

  const icons = {
    bestseller: TrendingUp,
    featured: Award,
    spicy: Flame,
    discount: undefined,
    new: Star,
    unavailable: undefined,
  };

  const Icon = icons[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
        styles[variant],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children || variant}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const styles: Record<string, string> = {
    placed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    confirmed: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    preparing: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    ready: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    out_for_delivery: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
    payment_failed: 'bg-red-500/15 text-red-400 border-red-500/30',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/15 text-red-400 border-red-500/30',
    refunded: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  };

  const labels: Record<string, string> = {
    placed: 'Placed',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    payment_failed: 'Payment Failed',
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize',
        styles[status] || 'bg-ink-700 text-ink-300 border-ink-600',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  );
}
