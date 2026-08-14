import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, ChevronRight } from 'lucide-react';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { Loader, ErrorState, EmptyState } from '@/components/ui/Loader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';

const STATUS_FILTERS = ['all', 'placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const { orders, loading, error } = useAdminOrders();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
        );
      }
      return true;
    });
  }, [orders, filter, search]);

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search by order number, name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-ink-600 bg-ink-900 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:border-ember-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors',
              filter === f ? 'bg-ember-500 text-ink-950' : 'border border-ink-700 text-cream-200 hover:bg-ink-800',
            )}
          >
            {f === 'all' ? 'All Orders' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-12 w-12" />} title="No orders found" message="Orders will appear here when customers place them" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-700/50 bg-ink-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {filtered.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-ink-800/30"
                >
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${order.id}`} className="font-mono text-xs font-semibold text-cream-100 hover:text-ember-400">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-cream-200">{order.customerName}</div>
                    <div className="text-xs text-ink-400">{order.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-300 text-xs">{order.items?.length || '—'}</td>
<<<<<<< HEAD
                  <td className="px-4 py-3 text-ink-300 text-xs">{formatDateTime(order.createdAt)}</td>
=======
                  <td className="px-4 py-3 text-ink-300 text-xs">{formatDateTime(order.created_at)}</td>
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
                  <td className="px-4 py-3 text-right font-semibold text-cream-50">{formatPrice(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${order.id}`} className="text-ink-400 hover:text-ember-400">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
