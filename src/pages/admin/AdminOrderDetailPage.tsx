import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, MapPin, Mail, User, Package, Clock } from 'lucide-react';
import { fetchOrder, updateOrderStatus, updatePaymentStatus } from '@/lib/api';
import type { Order } from '@/lib/types';
import { Loader, ErrorState } from '@/components/ui/Loader';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants';

const STATUS_FLOW = ORDER_STATUSES;

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadOrder = async () => {
    if (!id) return;
    try {
      const o = await fetchOrder(id);
      setOrder(o);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrder(); }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      showToast(`Order status updated to ${ORDER_STATUS_LABELS[newStatus]}`, 'success');
      loadOrder();
    } catch (e: any) {
      showToast(e.message || 'Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      await updatePaymentStatus(order.id, newStatus);
      showToast(`Payment status updated to ${PAYMENT_STATUS_LABELS[newStatus]}`, 'success');
      loadOrder();
    } catch (e: any) {
      showToast(e.message || 'Failed to update payment status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, 'cancelled');
      showToast('Order cancelled', 'success');
      loadOrder();
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel order', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;
  if (!order) return <ErrorState message="Order not found" />;

  const currentStepIndex = STATUS_FLOW.indexOf(order.status as any);
  const isCancelled = order.status === 'cancelled' || order.status === 'payment_failed';
  const isDelivered = order.status === 'delivered';

  return (
    <div className="space-y-6">
      <Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-cream-100">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-cream-50">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
        <StatusBadge status={order.paymentStatus} />
      </div>
      <p className="text-sm text-ink-300">{formatDateTime(order.createdAt)}</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order items + status management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status management */}
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-cream-50">Update Status</h2>

            <div className="flex flex-wrap gap-2">
              {STATUS_FLOW.map((status, index) => {
                const isCurrent = order.status === status;
                const isPast = !isCancelled && index <= currentStepIndex;
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updating || isCurrent || isCancelled || isDelivered}
                    className={cn(
                      'rounded-xl border px-4 py-2 text-sm font-medium transition-all',
                      isCurrent && 'border-ember-500 bg-ember-500 text-ink-950',
                      !isCurrent && isPast && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                      !isCurrent && !isPast && 'border-ink-600 text-cream-200 hover:bg-ink-800',
                      (isCancelled || isDelivered) && !isCurrent && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>

            {!isCancelled && !isDelivered && (
              <button
                onClick={handleCancel}
                disabled={updating}
                className="mt-4 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                Cancel Order
              </button>
            )}
          </div>

          {/* Order items */}
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-cream-50">Ordered Items</h2>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={item._id || `${item.menuItemId}-${index}`} className="flex items-center gap-4 rounded-xl bg-ink-800/50 p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cream-100">{item.name}</p>
                    <p className="text-xs text-ink-400">{formatPrice(item.price)} × {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-cream-50">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-ink-700 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-300"><span>Subtotal</span><span className="text-cream-100">{formatPrice(Number(order.subtotal))}</span></div>
              <div className="flex justify-between text-ink-300"><span>Tax</span><span className="text-cream-100">{formatPrice(Number(order.tax))}</span></div>
              <div className="flex justify-between text-ink-300"><span>Delivery</span><span className="text-cream-100">{formatPrice(Number(order.deliveryFee))}</span></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-400"><span>Discount {order.couponCode && `(${order.couponCode})`}</span><span>-{formatPrice(Number(order.discount))}</span></div>
              )}
              <div className="flex justify-between border-t border-ink-700 pt-2 text-base font-bold"><span className="text-cream-100">Total</span><span className="text-cream-50">{formatPrice(Number(order.total))}</span></div>
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-cream-50">Customer</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3"><User className="h-4 w-4 text-ink-400" /><span className="text-cream-200">{order.customerName}</span></div>
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-ink-400" /><span className="text-cream-200">{order.customerPhone}</span></div>
              {order.customerEmail && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-ink-400" /><span className="text-cream-200">{order.customerEmail}</span></div>}
            </div>
          </div>

          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-cream-50">Delivery</h2>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 text-ink-400" />
              <span className="text-cream-200">{order.deliveryAddress}</span>
            </div>
            {order.orderNotes && (
              <div className="mt-3 rounded-lg bg-ink-800 p-3 text-sm text-ink-300">
                <span className="font-semibold text-cream-200">Notes: </span>{order.orderNotes}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-cream-50">Payment</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-300">Method</span>
                <span className="capitalize text-cream-200">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-300">Status</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handlePaymentStatusChange('paid')} disabled={updating || order.paymentStatus === 'paid'}>
                  Mark Paid
                </Button>
                <Button size="sm" variant="outline" onClick={() => handlePaymentStatusChange('failed')} disabled={updating || order.paymentStatus === 'failed'}>
                  Mark Failed
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
