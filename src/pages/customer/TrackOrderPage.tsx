import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ReceiptText, CheckCheck, Flame, PackageCheck, Bike, Home, XCircle,
  Clock, MapPin, Phone, ShoppingBag, ArrowRight, RotateCcw,
} from 'lucide-react';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useToast } from '@/context/ToastContext';
import { Loader, ErrorState } from '@/components/ui/Loader';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, ESTIMATED_TIMES } from '@/lib/constants';

const STATUS_ICONS: Record<string, any> = {
  placed: ReceiptText,
  confirmed: CheckCheck,
  preparing: Flame,
  ready: PackageCheck,
  out_for_delivery: Bike,
  delivered: Home,
  cancelled: XCircle,
};

const FLOW_STATUSES = ORDER_STATUSES;

export default function TrackOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { order, loading, error } = useOrderTracking(id);

  if (loading) return <div className="container-narrow py-20"><Loader size="lg" /></div>;
  if (error) return <div className="container-narrow py-20"><ErrorState message={error} /></div>;
  if (!order) {
    return (
      <div className="container-narrow py-20">
        <ErrorState message="Order not found" />
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled' || order.status === 'payment_failed';
  const currentStepIndex = FLOW_STATUSES.indexOf(order.status as any);
  const progress = isCancelled ? 0 : ((currentStepIndex + 1) / FLOW_STATUSES.length) * 100;
  const estimatedTime = ESTIMATED_TIMES[order.status] ?? 0;

  return (
    <div className="container-narrow py-8 lg:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-display-lg font-bold text-cream-50">Track Order</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-2 text-sm text-ink-300">
          Order <span className="font-mono font-semibold text-cream-200">{order.orderNumber}</span> · {formatDateTime(order.created_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Tracking timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6 lg:p-8">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-cream-100">Order Progress</span>
                {!isCancelled && estimatedTime > 0 && (
                  <span className="flex items-center gap-1.5 text-ember-400">
                    <Clock className="h-4 w-4" /> Est. {estimatedTime} min
                  </span>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={cn('h-full rounded-full', isCancelled ? 'bg-red-500' : 'bg-gradient-to-r from-ember-500 to-gold-500')}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              {isCancelled && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-6 w-6 text-red-400" />
                    <div>
                      <h3 className="font-semibold text-red-400">Order Cancelled</h3>
                      <p className="text-sm text-ink-300">This order has been cancelled. Please contact us if you have questions.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {FLOW_STATUSES.map((status, index) => {
                  const Icon = STATUS_ICONS[status];
                  const isCompleted = !isCancelled && index <= currentStepIndex;
                  const isCurrent = !isCancelled && index === currentStepIndex;
                  const isLast = index === FLOW_STATUSES.length - 1;

                  return (
                    <div key={status} className="flex gap-4">
                      {/* Icon + line */}
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                            isCompleted && 'border-ember-500 bg-ember-500 text-ink-950',
                            isCurrent && 'border-ember-500 bg-ember-500/20 text-ember-400 animate-pulse-glow',
                            !isCompleted && !isCurrent && 'border-ink-600 bg-ink-800 text-ink-500',
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.div>
                        {!isLast && (
                          <div className={cn('w-0.5 h-10', isCompleted ? 'bg-ember-500' : 'bg-ink-700')} />
                        )}
                      </div>

                      {/* Label */}
                      <div className={cn('pb-8', isLast && 'pb-0')}>
                        <h3 className={cn(
                          'font-semibold transition-colors',
                          isCompleted ? 'text-cream-50' : isCurrent ? 'text-ember-400' : 'text-ink-400',
                        )}>
                          {ORDER_STATUS_LABELS[status]}
                        </h3>
                        {isCurrent && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-0.5 text-xs text-ember-400"
                          >
                            In progress...
                          </motion.p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items */}
            <div className="mt-6 border-t border-ink-700 pt-6">
              <h3 className="mb-4 font-semibold text-cream-100">Ordered Items</h3>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-cream-100">{item.name}</p>
                      <p className="text-xs text-ink-400">{formatPrice(item.price)} × {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-cream-50">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order details sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
            <h3 className="mb-4 font-semibold text-cream-100">Order Details</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-300">Subtotal</span>
                <span className="text-cream-100">{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-300">Tax</span>
                <span className="text-cream-100">{formatPrice(Number(order.tax))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-300">Delivery</span>
                <span className="text-cream-100">{formatPrice(Number(order.deliveryFee))}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-{formatPrice(Number(order.discount))}</span>
                </div>
              )}
              <div className="my-2 h-px bg-ink-700" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-cream-100">Total</span>
                <span className="text-cream-50">{formatPrice(Number(order.total))}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-ink-700 pt-4">
              <div className="flex items-center gap-2 text-sm text-ink-300">
                <span className="text-ink-400">Payment:</span>
                <span className="capitalize text-cream-200">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</span>
                <StatusBadge status={order.paymentStatus} className="ml-auto" />
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
            <h3 className="mb-4 font-semibold text-cream-100">Delivery Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-ember-500" />
                <span className="text-cream-200">{order.deliveryAddress}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-ember-500" />
                <span className="text-cream-200">{order.customerPhone}</span>
              </div>
              {order.customerName && (
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-4 w-4 shrink-0 text-ember-500" />
                  <span className="text-cream-200">{order.customerName}</span>
                </div>
              )}
              {order.orderNotes && (
                <div className="rounded-lg bg-ink-800 p-3 text-xs text-ink-300">
                  <span className="font-semibold text-cream-200">Notes: </span>{order.orderNotes}
                </div>
              )}
            </div>
          </div>

          <Button fullWidth variant="outline" onClick={() => navigate('/menu')}>
            Order More <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
