import { cn } from '@/lib/utils';

export default function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-ember-500 to-ember-700 shadow-lg shadow-ember-500/30">
        <span className="font-display text-xl font-bold text-ink-950">N</span>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-cream-100/20" />
      </div>
      {showText && (
        <div className="leading-none">
          <div className="font-display text-lg font-bold tracking-tight text-cream-50">AL NIHAR</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ember-500">Premium Burgers</div>
        </div>
      )}
    </div>
  );
}
