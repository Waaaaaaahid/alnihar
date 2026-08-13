import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/context/ToastContext';
import { formatPrice, calculateOrderTotals, cn } from '@/lib/utils';
import { fetchCouponByCode } from '@/lib/api';
import type { Coupon } from '@/lib/types';
import { EmptyState } from '@/components/ui/Loader';
import Button from '@/components/ui/Button';

export default function CartPage() {
  const { items, removeItem, incrementItem, decrementItem, clearCart } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const totals = calculateOrderTotals(items, settings, appliedCoupon);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const coupon = await fetchCouponByCode(couponCode.trim());
      if (!coupon) {
        setCouponError('Coupon not found');
        setAppliedCoupon(null);
      } else if (!coupon.isActive) {
        setCouponError('Coupon is not active');
        setAppliedCoupon(null);
      } else if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        setCouponError('Coupon has expired');
        setAppliedCoupon(null);
      } else if (totals.subtotal < coupon.minOrder) {
        setCouponError(`Minimum order ${formatPrice(coupon.minOrder)} required`);
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(coupon);
        showToast(`Coupon ${coupon.code} applied!`, 'success');
      }
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  if (items.length === 0) {
    return (
      <div className="container-narrow py-16 lg:py-24">
        <EmptyState
          icon={<ShoppingBag className="h-16 w-16" />}
          title="Your cart is empty"
          message="Looks like you haven't added anything yet. Let's fix that!"
          action={
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-xl bg-ember-500 px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-ember-600"
            >
              Browse Menu <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-narrow py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-display-lg font-bold text-cream-50">Your Cart</h1>
        <p className="mt-1 text-sm text-ink-300">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.menuItem.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 rounded-2xl border border-ink-700/50 bg-ink-900 p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                  <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="h-full w-full object-cover" />
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-cream-50 leading-tight">{item.menuItem.name}</h3>
                      <p className="mt-0.5 text-xs text-ink-400 line-clamp-1">{item.menuItem.description}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 rounded-xl bg-ink-800 p-1">
                      <button
                        onClick={() => decrementItem(item.menuItem.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-700 text-cream-100 transition-colors hover:bg-ink-600 active:scale-90"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[24px] text-center text-sm font-bold text-cream-50">{item.quantity}</span>
                      <button
                        onClick={() => incrementItem(item.menuItem.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-ember-500 text-ink-950 transition-colors hover:bg-ember-600 active:scale-90"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cream-50">{formatPrice(item.menuItem.price * item.quantity)}</div>
                      <div className="text-xs text-ink-400">{formatPrice(item.menuItem.price)} each</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            onClick={() => {
              clearCart();
              removeCoupon();
              showToast('Cart cleared', 'info');
            }}
            className="text-sm text-ink-400 hover:text-red-400 transition-colors"
          >
            Clear all items
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
            <h2 className="font-display text-lg font-bold text-cream-50">Order Summary</h2>

            {/* Coupon */}
            <div className="mt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">{appliedCoupon.code}</span>
                  </div>
                  <button onClick={removeCoupon} className="text-emerald-400 hover:text-emerald-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 rounded-xl border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-cream-100 placeholder:text-ink-400 focus:border-ember-500 focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    loading={couponLoading}
                  >
                    Apply
                  </Button>
                </div>
              )}
              {couponError && <p className="mt-1.5 text-xs text-red-400">{couponError}</p>}
            </div>

            <div className="my-4 h-px bg-ink-700" />

            {/* Totals */}
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-ink-300">
                <span>Subtotal</span>
                <span className="text-cream-100">{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-300">
                <span>Tax ({settings?.taxRate || 5}%)</span>
                <span className="text-cream-100">{formatPrice(totals.tax)}</span>
              </div>
              <div className="flex justify-between text-ink-300">
                <span>Delivery Fee</span>
                <span className="text-cream-100">{formatPrice(totals.deliveryFee)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-{formatPrice(totals.discount)}</span>
                </div>
              )}
            </div>

            <div className="my-4 h-px bg-ink-700" />

            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold text-cream-100">Total</span>
              <span className="font-display text-2xl font-bold text-cream-50">{formatPrice(totals.total)}</span>
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              onClick={() => navigate('/checkout', { state: { coupon: appliedCoupon } })}
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Link
              to="/menu"
              className="mt-3 block text-center text-sm text-ink-400 hover:text-ember-400 transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
