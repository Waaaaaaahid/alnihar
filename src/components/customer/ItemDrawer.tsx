import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Flame, Award, TrendingUp, ShoppingBag } from 'lucide-react';
import type { MenuItem } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ItemDrawerProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  recommended?: MenuItem[];
}

export default function ItemDrawer({ item, open, onClose, recommended = [] }: ItemDrawerProps) {
  const { addItem, getItemQuantity, incrementItem, decrementItem } = useCart();
  const { showToast } = useToast();
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
  }, [item?.id]);

  if (!item) return null;

  const quantity = getItemQuantity(item.id);
  const discount = item.originalPrice && item.originalPrice > item.price
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0;

  const handleAdd = () => {
    if (!item.isAvailable) return;
    addItem(item);
    showToast(`${item.name} added to cart`, 'success');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-ink-700 bg-ink-900 sm:rounded-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/80 text-cream-100 backdrop-blur transition-colors hover:bg-ink-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex-1 overflow-y-auto">
              {/* Hero image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-800">
                {!imgLoaded && <div className="skeleton absolute inset-0" />}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  onLoad={() => setImgLoaded(true)}
                  className={cn('h-full w-full object-cover', imgLoaded ? 'opacity-100' : 'opacity-0')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />

                {/* Badges */}
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {item.isBestseller && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ember-500 px-2.5 py-1 text-xs font-bold uppercase text-ink-950">
                      <TrendingUp className="h-3 w-3" /> Bestseller
                    </span>
                  )}
                  {item.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-500 px-2.5 py-1 text-xs font-bold uppercase text-ink-950">
                      <Award className="h-3 w-3" /> Featured
                    </span>
                  )}
                  {item.isSpicy && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold uppercase text-white">
                      <Flame className="h-3 w-3" /> Spicy
                    </span>
                  )}
                </div>

                {discount > 0 && (
                  <div className="absolute right-4 bottom-4 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-bold text-ink-950 shadow-lg">
                    {discount}% OFF
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {item.category && (
                  <span className="text-xs font-medium uppercase tracking-wider text-ember-500">
                    {item.category.name}
                  </span>
                )}
                <h2 className="mt-1 font-display text-2xl font-bold text-cream-50">{item.name}</h2>

                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-cream-50">{formatPrice(item.price)}</span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-base text-ink-400 line-through">{formatPrice(item.originalPrice)}</span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-ink-300">{item.description}</p>

                <div className="mt-4 flex items-center gap-2">
                  {item.isAvailable ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Available now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-red-400">
                      <span className="h-2 w-2 rounded-full bg-red-400" /> Currently unavailable
                    </span>
                  )}
                </div>

                {/* Recommended items */}
                {recommended.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cream-100">
                      You might also like
                    </h3>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      {recommended.slice(0, 6).map((rec) => (
                        <button
                          key={rec.id}
                          onClick={() => {
                            onClose();
                            setTimeout(() => {
                              const event = new CustomEvent('open-item', { detail: rec });
                              window.dispatchEvent(event);
                            }, 100);
                          }}
                          className="group shrink-0 w-36 text-left"
                        >
                          <div className="aspect-square w-full overflow-hidden rounded-xl bg-ink-800">
                            <img src={rec.imageUrl} alt={rec.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          </div>
                          <p className="mt-2 text-xs font-medium text-cream-200 line-clamp-1">{rec.name}</p>
                          <p className="text-xs text-ember-400 font-semibold">{formatPrice(rec.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky bottom action */}
            <div className="border-t border-ink-700 p-4">
              {quantity === 0 ? (
                <button
                  onClick={handleAdd}
                  disabled={!item.isAvailable}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-ember-500 py-3.5 font-semibold text-ink-950 transition-all hover:bg-ember-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Add to Cart · {formatPrice(item.price)}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex flex-1 items-center justify-between rounded-xl bg-ink-800 p-1.5">
                    <button
                      onClick={() => decrementItem(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-700 text-cream-100 transition-colors hover:bg-ink-600 active:scale-90"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-base font-bold text-cream-50">{quantity}</span>
                    <button
                      onClick={() => incrementItem(item.id)}
                      disabled={!item.isAvailable}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-500 text-ink-950 transition-colors hover:bg-ember-600 active:scale-90"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => { showToast(`${item.name} quantity updated`, 'success'); onClose(); }}
                    className="flex-1 rounded-xl border border-ember-500 py-3.5 font-semibold text-ember-400 transition-colors hover:bg-ember-500/10"
                  >
                    {formatPrice(item.price * quantity)}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
