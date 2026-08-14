import { motion } from 'framer-motion';
import { Plus, Minus, Star, Flame, Award, TrendingUp } from 'lucide-react';
import type { MenuItem } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { formatPrice, cn } from '@/lib/utils';
import { useState } from 'react';

interface MenuItemCardProps {
  item: MenuItem;
  onClick?: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onClick }: MenuItemCardProps) {
  const { addItem, getItemQuantity, incrementItem, decrementItem } = useCart();
  const quantity = getItemQuantity(item.id);
  const [imgLoaded, setImgLoaded] = useState(false);

  const discount = item.originalPrice && item.originalPrice > item.price
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      onClick={() => onClick?.(item)}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-2xl border border-ink-700/50 bg-ink-900 transition-all duration-300',
        'hover:border-ink-600 hover:shadow-xl hover:shadow-ink-950/40',
        !item.isAvailable && 'opacity-60',
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        {!imgLoaded && <div className="skeleton absolute inset-0" />}
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={cn(
            'h-full w-full object-cover transition-all duration-500 group-hover:scale-105',
            imgLoaded ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {item.isBestseller && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ember-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950 shadow-lg">
              <TrendingUp className="h-2.5 w-2.5" /> Bestseller
            </span>
          )}
          {item.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950 shadow-lg">
              <Award className="h-2.5 w-2.5" /> Featured
            </span>
          )}
          {item.isSpicy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
              <Flame className="h-2.5 w-2.5" /> Spicy
            </span>
          )}
        </div>

        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute right-3 top-3 rounded-lg bg-emerald-500 px-2 py-1 text-xs font-bold text-ink-950 shadow-lg">
            {discount}% OFF
          </div>
        )}

        {/* Unavailable overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/50">
            <span className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-ink-300">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-base font-semibold text-cream-50 leading-tight line-clamp-1">{item.name}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-300 line-clamp-2 min-h-[2rem]">{item.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-cream-50">{formatPrice(item.price)}</span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-ink-400 line-through">{formatPrice(item.originalPrice)}</span>
            )}
          </div>

          {quantity === 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (item.isAvailable) addItem(item);
              }}
              disabled={!item.isAvailable}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember-500 text-ink-950 transition-all hover:bg-ember-600 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-ember-500/20"
              aria-label="Add to cart"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-xl bg-ink-800 p-1"
            >
              <button
                onClick={() => decrementItem(item.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-700 text-cream-100 transition-colors hover:bg-ink-600 active:scale-90"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[20px] text-center text-sm font-bold text-cream-50">{quantity}</span>
              <button
                onClick={() => incrementItem(item.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-ember-500 text-ink-950 transition-colors hover:bg-ember-600 active:scale-90"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
