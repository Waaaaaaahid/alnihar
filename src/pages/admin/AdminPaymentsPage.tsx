import { useEffect, useState } from 'react';
import { ChevronDown, CreditCard, MapPin, Phone, Mail, Package } from 'lucide-react';
import { fetchAllPayments } from '@/lib/api';
import { Loader, ErrorState, EmptyState } from '@/components/ui/Loader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatPrice, formatDateTime } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchAllPayments()
      .then(setPayments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-300">{payments.length} paid online payment{payments.length !== 1 ? 's' : ''}</p>

      {payments.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-12 w-12" />} title="No payments" message="Online payment records will appear here after an online order is marked paid" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-700/50 bg-ink-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {payments.map((p) => {
                const order = p.order;
                const isOpen = expanded === p.id;
                return (
                  <>
                    <tr key={p.id} onClick={() => setExpanded(isOpen ? null : p.id)} className="cursor-pointer hover:bg-ink-800/30">
                      <td className="px-4 py-3 font-mono text-xs text-cream-100">{order?.orderNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="text-cream-200">{order?.customerName || '—'}</div>
                        <div className="text-xs text-ink-400">{order?.customerPhone || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-300 text-xs">{order?.items?.length || 0}</td>
                      <td className="px-4 py-3"><StatusBadge status="paid" /></td>
                      <td className="px-4 py-3 text-ink-300 text-xs">{formatDateTime(p.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-cream-50">{formatPrice(Number(p.amount))}</td>
                      <td className="px-4 py-3 text-ink-400"><ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></td>
                    </tr>
                    {isOpen && order && (
                      <tr key={`${p.id}-details`} className="bg-ink-950/60">
                        <td colSpan={7} className="px-4 py-5">
                          <div className="grid gap-5 lg:grid-cols-3">
                            <div className="space-y-3">
                              <h3 className="font-display font-bold text-cream-50">Customer Details</h3>
                              <p className="flex items-center gap-2 text-sm text-cream-200"><Phone className="h-4 w-4 text-ink-400" />{order.customerPhone || '—'}</p>
                              <p className="flex items-center gap-2 text-sm text-cream-200"><Mail className="h-4 w-4 text-ink-400" />{order.customerEmail || '—'}</p>
                              <p className="flex items-start gap-2 text-sm text-cream-200"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />{order.deliveryAddress || '—'}</p>
                            </div>
                            <div className="space-y-3">
                              <h3 className="font-display font-bold text-cream-50">Order Details</h3>
                              <div className="space-y-2 text-sm text-ink-300">
                                {order.items?.map((item: any, index: number) => (
                                  <div key={`${item.name}-${index}`} className="flex justify-between gap-3">
                                    <span className="flex items-center gap-2 text-cream-200"><Package className="h-3.5 w-3.5 text-ink-400" />{item.name} × {item.quantity}</span>
                                    <span>{formatPrice(Number(item.price) * Number(item.quantity))}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h3 className="font-display font-bold text-cream-50">Payment Summary</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-ink-300"><span>Method</span><span className="text-cream-200">Online</span></div>
                                <div className="flex justify-between text-ink-300"><span>Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span></div>
                                <div className="flex justify-between text-ink-300"><span>Tax</span><span>{formatPrice(Number(order.tax))}</span></div>
                                <div className="flex justify-between text-ink-300"><span>Delivery</span><span>{formatPrice(Number(order.deliveryFee))}</span></div>
                                <div className="flex justify-between border-t border-ink-700 pt-2 font-bold text-cream-50"><span>Total Paid</span><span>{formatPrice(Number(p.amount))}</span></div>
                              </div>
                              {p.razorpayPaymentId && <p className="break-all text-xs text-ink-400">Payment ID: {p.razorpayPaymentId}</p>}
                              {order.orderNotes && <p className="rounded-lg bg-ink-800 p-2 text-xs text-ink-300">Notes: {order.orderNotes}</p>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
