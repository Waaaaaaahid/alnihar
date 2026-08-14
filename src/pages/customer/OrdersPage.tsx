import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Search, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchUserOrders } from '@/lib/api';
import type { Order } from '@/lib/types';
import { Loader, EmptyState, ErrorState } from '@/components/ui/Loader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatPrice, formatDateTime } from '@/lib/utils';

export default function OrdersPage() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    fetchUserOrders(session.user.id)
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const filtered = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.status.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <div className="container-narrow py-20"><Loader size="lg" /></div>;

  return (
    <div className="container-narrow py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-display-lg font-bold text-cream-50">My Orders</h1>
        <p className="mt-2 text-sm text-ink-300">Track and manage your orders</p>
      </div>

      {!session?.user?.id ? (
        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="Sign in to view your orders"
          message="You need an account to see your order history"
          action={
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-ember-500 px-6 py-3 text-sm font-semibold text-ink-950">
              Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : error ? (
        <ErrorState message={error} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="No orders yet"
          message="When you place an order, it'll show up here"
          action={
            <Link to="/menu" className="inline-flex items-center gap-2 rounded-xl bg-ember-500 px-6 py-3 text-sm font-semibold text-ink-950">
              Start Ordering <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <>
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search by order number or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-ink-600 bg-ink-900 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:border-ember-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            {filtered.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/track/${order.id}`}
                  className="block rounded-2xl border border-ink-700/50 bg-ink-900 p-5 transition-all hover:border-ink-600 hover:bg-ink-800/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-cream-50">{order.orderNumber}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-xs text-ink-400">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cream-50">{formatPrice(Number(order.total))}</div>
                      <div className="text-xs text-ink-400">{order.items?.length || 0} item(s)</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
