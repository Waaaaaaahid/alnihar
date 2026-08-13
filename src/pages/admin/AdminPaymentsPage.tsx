import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { fetchAllPayments } from '@/lib/api';
import { Loader, ErrorState, EmptyState } from '@/components/ui/Loader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatPrice, formatDateTime } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <p className="text-sm text-ink-300">{payments.length} payment record{payments.length !== 1 ? 's' : ''}</p>

      {payments.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-12 w-12" />} title="No payments" message="Online payment records will appear here" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-700/50 bg-ink-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Payment ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-ink-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-cream-100">{p.order?.orderNumber || '—'}</td>
                  <td className="px-4 py-3 text-cream-200">{p.order?.customerName || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-300">{p.razorpayPaymentId || p.razorpayOrderId || '—'}</td>
                  <td className="px-4 py-3 text-ink-300 text-xs">{formatDateTime(p.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold text-cream-50">{formatPrice(Number(p.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
