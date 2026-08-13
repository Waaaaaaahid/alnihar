import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShoppingBag, Banknote, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/context/ToastContext';
import { Input, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatPrice, calculateOrderTotals, validatePhone, validateEmail, cn } from '@/lib/utils';
import { createOrder, fetchCouponByCode } from '@/lib/api';
import type { Coupon } from '@/lib/types';
import { EmptyState } from '@/components/ui/Loader';

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { profile, session } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const passedCoupon = (location.state as { coupon?: Coupon })?.coupon || null;
  const [coupon, setCoupon] = useState<Coupon | null>(passedCoupon);

  const [form, setForm] = useState({
    customer_name: profile?.name || '',
    customer_phone: profile?.phone || '',
    customer_email: session?.user?.email || '',
    delivery_address: '',
    order_notes: '',
    payment_method: 'cod' as 'cod' | 'razorpay',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const totals = calculateOrderTotals(items, settings, coupon);

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = 'Name is required';
    if (!form.customerPhone.trim()) e.customerPhone = 'Phone is required';
    else if (!validatePhone(form.customerPhone)) e.customerPhone = 'Invalid phone number';
    if (form.customerEmail && !validateEmail(form.customerEmail)) e.customerEmail = 'Invalid email';
    if (!form.deliveryAddress.trim()) e.deliveryAddress = 'Delivery address is required';
    else if (form.deliveryAddress.trim().length < 10) e.deliveryAddress = 'Please enter a complete address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast('Please fix the errors below', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        user_id: session?.user?.id || null,
        customer_name: form.customerName,
        customer_phone: form.customerPhone,
        customer_email: form.customerEmail,
        delivery_address: form.deliveryAddress,
        order_notes: form.orderNotes,
        payment_method: form.paymentMethod,
        items,
        coupon_code: coupon?.code || '',
        settings,
        coupon,
      });

      clearCart();
      showToast('Order placed successfully!', 'success');
      navigate(`/track/${order.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-narrow py-16 lg:py-24">
        <EmptyState
          icon={<ShoppingBag className="h-16 w-16" />}
          title="Your cart is empty"
          message="Add some items before checking out"
          action={
            <Link to="/menu" className="inline-flex items-center gap-2 rounded-xl bg-ember-500 px-6 py-3 text-sm font-semibold text-ink-950">
              Browse Menu <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-narrow py-8 lg:py-12">
      <Link to="/cart" className="mb-6 inline-flex items-center gap-2 text-sm text-ink-400 hover:text-cream-100">
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </Link>

      <h1 className="font-display text-display-lg font-bold text-cream-50">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-cream-50">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ember-500 text-xs font-bold text-ink-950">1</span>
              Contact Details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                name="customer_name"
                value={form.customerName}
                onChange={(e) => update('customer_name', e.target.value)}
                error={errors.customerName}
                placeholder="John Doe"
              />
              <Input
                label="Phone Number"
                name="customer_phone"
                value={form.customerPhone}
                onChange={(e) => update('customer_phone', e.target.value)}
                error={errors.customerPhone}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Email (optional)"
                name="customer_email"
                type="email"
                value={form.customerEmail}
                onChange={(e) => update('customer_email', e.target.value)}
                error={errors.customerEmail}
                placeholder="john@example.com"
              />
            </div>
          </motion.div>

          {/* Delivery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-cream-50">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ember-500 text-xs font-bold text-ink-950">2</span>
              Delivery Address
            </h2>
            <Textarea
              name="delivery_address"
              value={form.deliveryAddress}
              onChange={(e) => update('delivery_address', e.target.value)}
              error={errors.deliveryAddress}
              placeholder="House number, street, area, landmark, city, pincode"
              rows={3}
            />
            <div className="mt-4">
              <Textarea
                label="Order Notes (optional)"
                name="order_notes"
                value={form.orderNotes}
                onChange={(e) => update('order_notes', e.target.value)}
                placeholder="e.g. Ring the bell twice, extra ketchup, etc."
                rows={2}
              />
            </div>
          </motion.div>

          {/* Payment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-cream-50">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ember-500 text-xs font-bold text-ink-950">3</span>
              Payment Method
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => update('payment_method', 'cod')}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
                  form.paymentMethod === 'cod'
                    ? 'border-ember-500 bg-ember-500/10'
                    : 'border-ink-600 hover:border-ink-500',
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  form.paymentMethod === 'cod' ? 'bg-ember-500 text-ink-950' : 'bg-ink-800 text-ink-300',
                )}>
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-cream-100">Cash on Delivery</div>
                  <div className="text-xs text-ink-300">Pay when you receive</div>
                </div>
                {form.paymentMethod === 'cod' && <CheckCircle2 className="ml-auto h-5 w-5 text-ember-500" />}
              </button>

              <button
                onClick={() => update('payment_method', 'razorpay')}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
                  form.paymentMethod === 'razorpay'
                    ? 'border-ember-500 bg-ember-500/10'
                    : 'border-ink-600 hover:border-ink-500',
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  form.paymentMethod === 'razorpay' ? 'bg-ember-500 text-ink-950' : 'bg-ink-800 text-ink-300',
                )}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-cream-100">Online Payment</div>
                  <div className="text-xs text-ink-300">Pay via card/UPI</div>
                </div>
                {form.paymentMethod === 'razorpay' && <CheckCircle2 className="ml-auto h-5 w-5 text-ember-500" />}
              </button>
            </div>
            {form.paymentMethod === 'razorpay' && (
              <p className="mt-3 text-xs text-ink-400">
                You'll be redirected to a secure payment gateway after placing your order.
              </p>
            )}
          </motion.div>
        </div>

        {/* Summary */}
        <div>
          <div className="sticky top-24 rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
            <h2 className="font-display text-lg font-bold text-cream-50">Order Summary</h2>

            <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <div key={item.menuItem.id} className="flex items-center gap-3 text-sm">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                    <img src={item.menuItem.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-cream-200 truncate text-xs">{item.menuItem.name}</p>
                    <p className="text-ink-400 text-xs">×{item.quantity}</p>
                  </div>
                  <span className="text-cream-100 text-xs font-medium">{formatPrice(item.menuItem.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="my-4 h-px bg-ink-700" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink-300">
                <span>Subtotal</span><span className="text-cream-100">{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-300">
                <span>Tax</span><span className="text-cream-100">{formatPrice(totals.tax)}</span>
              </div>
              <div className="flex justify-between text-ink-300">
                <span>Delivery</span><span className="text-cream-100">{formatPrice(totals.deliveryFee)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount {coupon && `(${coupon.code})`}</span><span>-{formatPrice(totals.discount)}</span>
                </div>
              )}
            </div>

            <div className="my-4 h-px bg-ink-700" />

            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-cream-100">Total</span>
              <span className="font-display text-2xl font-bold text-cream-50">{formatPrice(totals.total)}</span>
            </div>

            <Button fullWidth size="lg" className="mt-6" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order...</> : <>Place Order <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
