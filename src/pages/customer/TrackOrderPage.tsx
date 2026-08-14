import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ReceiptText, CheckCheck, Flame, PackageCheck, Bike, Home, XCircle, Clock, MapPin, Phone, ShoppingBag, ArrowRight, Star, Send, CheckCircle2 } from 'lucide-react';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { Loader, ErrorState } from '@/components/ui/Loader';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { fetchMyOrderReview, createReview } from '@/lib/api';
import type { Review } from '@/lib/types';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, ESTIMATED_TIMES } from '@/lib/constants';

const STATUS_ICONS: Record<string, any> = { placed: ReceiptText, confirmed: CheckCheck, preparing: Flame, ready: PackageCheck, out_for_delivery: Bike, delivered: Home, cancelled: XCircle };
const FLOW_STATUSES = ORDER_STATUSES;

export default function TrackOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { order, loading, error } = useOrderTracking(id);
  const [deliveryCelebrationShown, setDeliveryCelebrationShown] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Keep ownership checks resilient to Mongo ObjectId/string serialization differences.
  const isOwner = !!session?.user?.id && !!order && String(order.userId ?? '') === String(session.user.id);

  useEffect(() => {
    if (order?.status === 'delivered') {
      const key = `alnihar-delivered-${order.id}`;
      if (!sessionStorage.getItem(key)) {
        setDeliveryCelebrationShown(true);
        sessionStorage.setItem(key, '1');
      }
    }
  }, [order?.status, order?.id]);

  useEffect(() => {
    if (order?.status === 'delivered' && isOwner && id) {
      fetchMyOrderReview(id).then((review) => {
        setMyReview(review);
        if (review) {
          setRating(review.rating);
          setComment(review.comment);
        }
      });
    }
  }, [order?.status, isOwner, id]);

  const handleSubmitReview = async () => {
    if (!rating || !order) return;
    setSubmitting(true);
    try {
      const submittedReview = await createReview({
        orderId: order.id,
        rating,
        comment: comment.trim(),
      });
      // Keep the exact server response so the confirmation reflects what was saved.
      setMyReview(submittedReview);
      setJustSubmitted(true);
    } catch {
      // Already reviewed or failed — load server state so UI reflects truth.
      const review = await fetchMyOrderReview(order.id);
      if (review) {
        setMyReview(review);
        setRating(review.rating);
        setComment(review.comment);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container-narrow py-20"><Loader size="lg" /></div>;
  if (error) return <div className="container-narrow py-20"><ErrorState message={error} /></div>;
  if (!order) return <div className="container-narrow py-20"><ErrorState message="Order not found" /></div>;

  const isCancelled = order.status === 'cancelled' || order.status === 'payment_failed';
  const isDelivered = order.status === 'delivered';
  const currentStepIndex = FLOW_STATUSES.indexOf(order.status as any);
  const progress = isCancelled ? 0 : ((currentStepIndex + 1) / FLOW_STATUSES.length) * 100;
  const estimatedTime = ESTIMATED_TIMES[order.status] ?? 0;
  const animateDelivery = deliveryCelebrationShown;

  return (
    <div className="container-narrow py-8 lg:py-12">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-display-lg font-bold text-cream-50">Track Order</h1><StatusBadge status={order.status} /></div>
        <p className="mt-2 text-sm text-ink-300">Order <span className="font-mono font-semibold text-cream-200">{order.orderNumber}</span> · {formatDateTime(order.createdAt)}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <motion.div layout transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className={cn('overflow-hidden rounded-2xl border bg-ink-900 p-6 lg:p-8', isDelivered ? 'border-ember-500/30' : 'border-ink-700/50')}>
            <AnimatePresence mode="wait" initial={false}>
              {!isDelivered ? (
                <motion.div key="tracking" layout initial={{ opacity: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.28, ease: 'easeInOut' }}>
                  <div className="mb-8">
                    <div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold text-cream-100">Order Progress</span>{!isCancelled && estimatedTime > 0 && <span className="flex items-center gap-1.5 text-ember-400"><Clock className="h-4 w-4" /> Est. {estimatedTime} min</span>}</div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-800"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={cn('h-full rounded-full', isCancelled ? 'bg-red-500' : 'bg-gradient-to-r from-ember-500 to-gold-500')} /></div>
                  </div>

                  <div className="relative">
                    {isCancelled && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4"><div className="flex items-center gap-3"><XCircle className="h-6 w-6 text-red-400" /><div><h3 className="font-semibold text-red-400">Order Cancelled</h3><p className="text-sm text-ink-300">This order has been cancelled. Please contact us if you have questions.</p></div></div></div>}
                    <div className="space-y-1">
                      {FLOW_STATUSES.map((status, index) => {
                        const Icon = STATUS_ICONS[status];
                        const isCompleted = !isCancelled && index <= currentStepIndex;
                        const isCurrent = !isCancelled && index === currentStepIndex;
                        const isLast = index === FLOW_STATUSES.length - 1;
                        return <div key={status} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.1 }} className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all', isCompleted && 'border-ember-500 bg-ember-500 text-ink-950', isCurrent && 'border-ember-500 bg-ember-500/20 text-ember-400 animate-pulse-glow', !isCompleted && !isCurrent && 'border-ink-600 bg-ink-800 text-ink-500')}><Icon className="h-5 w-5" /></motion.div>
                            {!isLast && <div className={cn('w-0.5 h-10', isCompleted ? 'bg-ember-500' : 'bg-ink-700')} />}
                          </div>
                          <div className={cn('pb-8', isLast && 'pb-0')}><h3 className={cn('font-semibold transition-colors', isCompleted ? 'text-cream-50' : isCurrent ? 'text-ember-400' : 'text-ink-400')}>{ORDER_STATUS_LABELS[status]}</h3>{isCurrent && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-0.5 text-xs text-ember-400">In progress...</motion.p>}</div>
                        </div>;
                      })}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="delivered" layout initial={animateDelivery ? { opacity: 0, scale: 0.94, y: 14 } : false} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="py-2 text-center">
                  <motion.div initial={animateDelivery ? { scale: 0.7, rotate: -8 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ delay: animateDelivery ? 0.08 : 0, type: 'spring', stiffness: 180, damping: 13 }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ember-400/40 bg-ember-500/10 text-ember-400 shadow-[0_0_30px_rgba(245,158,11,0.14)]">
                    <PackageCheck className="h-7 w-7" />
                  </motion.div>
                  <motion.h3 initial={animateDelivery ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: animateDelivery ? 0.2 : 0, duration: 0.35 }} className="mt-4 font-display text-xl font-bold text-cream-50">Order Delivered</motion.h3>
                  <motion.p initial={animateDelivery ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: animateDelivery ? 0.3 : 0, duration: 0.35 }} className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-300">Thank you for ordering from AL NIHAR. We hope you enjoyed your meal and look forward to serving you again.</motion.p>
                  <motion.div initial={animateDelivery ? { scaleX: 0, opacity: 0 } : false} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: animateDelivery ? 0.4 : 0, duration: 0.45 }} className="mx-auto mt-5 h-px max-w-24 origin-center bg-gradient-to-r from-transparent via-ember-500/60 to-transparent" />

                  {isOwner && isDelivered && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: animateDelivery ? 0.5 : 0, duration: 0.4 }} className="mt-8 border-t border-ink-700/60 pt-8 text-left">
                      <AnimatePresence mode="wait" initial={false}>
                        {myReview || justSubmitted ? (
                          <motion.div key="review-done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }} className="mx-auto max-w-md text-center">
                            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.05 }} className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-400">
                              <CheckCircle2 className="h-6 w-6" />
                            </motion.div>
                            <h4 className="mt-4 font-display text-lg font-bold text-cream-50">Thank you for your review!</h4>
                            <div className="mt-2 flex justify-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={i < (myReview?.rating || rating) ? 'h-5 w-5 fill-gold-500 text-gold-500' : 'h-5 w-5 text-ink-600'} />
                              ))}
                            </div>
                            {myReview?.comment && <p className="mt-3 text-sm leading-6 text-ink-300">"{myReview.comment}"</p>}
                            <p className="mt-4 text-xs text-ink-400">Your review has been submitted and is waiting for admin approval before it appears in “What People Say”.</p>
                          </motion.div>
                        ) : (
                          <motion.div key="review-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="mx-auto max-w-md">
                            <h4 className="text-center font-display text-lg font-bold text-cream-50">Rate Your Order</h4>
                            <p className="mt-1 text-center text-sm text-ink-300">How was your experience with AL NIHAR?</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onMouseEnter={() => setHoverRating(i + 1)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  onClick={() => setRating(i + 1)}
                                  className="transition-transform hover:scale-110 focus:outline-none"
                                  aria-label={`${i + 1} star`}
                                >
                                  <Star className={cn('h-9 w-9 transition-colors', (hoverRating || rating) > i ? 'fill-gold-500 text-gold-500' : 'text-ink-600')} />
                                </button>
                              ))}
                            </div>
                            <div className="mt-5">
                              <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience (optional)"
                                rows={3}
                                className="w-full rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-sm text-cream-100 placeholder:text-ink-400 focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-500/40"
                              />
                            </div>
                            <Button fullWidth className="mt-4" onClick={handleSubmitReview} loading={submitting} disabled={!rating}>
                              <Send className="h-4 w-4" /> Submit Review
                            </Button>
                            <p className="mt-3 text-center text-xs text-ink-400">Only you can review this order — one review per order.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6 lg:p-8"><h3 className="mb-4 font-semibold text-cream-100">Ordered Items</h3><div className="space-y-3">{order.items?.map((item, i) => <div key={item._id || i} className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-800"><img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /></div><div className="flex-1"><p className="text-sm font-medium text-cream-100">{item.name}</p><p className="text-xs text-ink-400">{formatPrice(item.price)} × {item.quantity}</p></div><span className="text-sm font-semibold text-cream-50">{formatPrice(item.price * item.quantity)}</span></div>)}</div></div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6"><h3 className="mb-4 font-semibold text-cream-100">Order Details</h3><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-ink-300">Subtotal</span><span className="text-cream-100">{formatPrice(Number(order.subtotal))}</span></div><div className="flex justify-between"><span className="text-ink-300">Tax</span><span className="text-cream-100">{formatPrice(Number(order.tax))}</span></div><div className="flex justify-between"><span className="text-ink-300">Delivery</span><span className="text-cream-100">{formatPrice(Number(order.deliveryFee))}</span></div>{Number(order.discount) > 0 && <div className="flex justify-between text-emerald-400"><span>Discount {order.couponCode && `(${order.couponCode})`}</span><span>-{formatPrice(Number(order.discount))}</span></div>}<div className="my-2 h-px bg-ink-700" /><div className="flex justify-between text-base font-bold"><span className="text-cream-100">Total</span><span className="text-cream-50">{formatPrice(Number(order.total))}</span></div></div><div className="mt-4 space-y-2 border-t border-ink-700 pt-4"><div className="flex items-center gap-2 text-sm text-ink-300"><span className="text-ink-400">Payment:</span><span className="capitalize text-cream-200">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</span><StatusBadge status={order.paymentStatus} className="ml-auto" /></div></div></div>
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6"><h3 className="mb-4 font-semibold text-cream-100">Delivery Information</h3><div className="space-y-3 text-sm"><div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" /><span className="text-cream-200">{order.deliveryAddress}</span></div><div className="flex items-center gap-3"><Phone className="h-4 w-4 shrink-0 text-ember-500" /><span className="text-cream-200">{order.customerPhone}</span></div>{order.customerName && <div className="flex items-center gap-3"><ShoppingBag className="h-4 w-4 shrink-0 text-ember-500" /><span className="text-cream-200">{order.customerName}</span></div>}{order.orderNotes && <div className="rounded-lg bg-ink-800 p-3 text-xs text-ink-300"><span className="font-semibold text-cream-200">Notes: </span>{order.orderNotes}</div>}</div></div>
          <Button fullWidth variant="outline" onClick={() => navigate('/menu')}>Order More <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
