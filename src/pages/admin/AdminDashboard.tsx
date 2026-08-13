import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, IndianRupee, Clock, Flame, CheckCircle2, Users, UtensilsCrossed, ArrowRight,
} from 'lucide-react';
import { fetchAdminStats, fetchRecentOrders, fetchSalesData } from '@/lib/api';
import type { Order } from '@/lib/types';
import { Loader, ErrorState } from '@/components/ui/Loader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [sales, setSales] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAdminStats(), fetchRecentOrders(6), fetchSalesData(7)])
      .then(([s, r, sales]) => {
        setStats(s);
        setRecent(r);
        setSales(sales);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;
  if (!stats) return null;

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: "Today's Orders", value: stats.todayOrders, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Revenue', value: formatPrice(stats.revenue), icon: IndianRupee, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Preparing', value: stats.preparingOrders, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Completed', value: stats.completedOrders, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Menu Items', value: stats.totalMenuItems, icon: UtensilsCrossed, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  const maxSales = Math.max(...sales.map((s) => s.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-ink-700/50 bg-ink-900 p-5"
          >
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', card.bg)}>
              <card.icon className={cn('h-5 w-5', card.color)} />
            </div>
            <div className="mt-3">
              <p className="font-display text-2xl font-bold text-cream-50">{card.value}</p>
              <p className="text-xs text-ink-300">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales chart */}
        <div className="lg:col-span-2 rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
          <h2 className="mb-6 font-display text-lg font-bold text-cream-50">Sales (Last 7 Days)</h2>
          <div className="flex h-48 items-end justify-between gap-2">
            {sales.map((day, i) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.revenue / maxSales) * 100}%` }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 100 }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-ember-600 to-ember-400 min-h-[4px]"
                    style={{ minHeight: 4 }}
                  />
                </div>
                <span className="text-[10px] text-ink-400">
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </span>
                <span className="text-[10px] font-medium text-cream-200">{day.orders}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-cream-50">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-300">Available Items</span>
              <span className="font-semibold text-emerald-400">{stats.availableItems}/{stats.totalMenuItems}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-300">Avg Order Value</span>
              <span className="font-semibold text-cream-100">
                {stats.totalOrders > 0 ? formatPrice(stats.revenue / stats.totalOrders) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-300">Completion Rate</span>
              <span className="font-semibold text-cream-100">
                {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
              </span>
            </div>
          </div>
          <Link
            to="/admin/orders"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-ink-600 py-2.5 text-sm font-medium text-cream-200 hover:bg-ink-800"
          >
            Manage Orders <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-cream-50">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm font-medium text-ember-400 hover:text-ember-300">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wider text-ink-400">
                <th className="pb-3 pr-4 font-medium">Order</th>
                <th className="pb-3 pr-4 font-medium">Customer</th>
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {recent.map((order) => (
                <tr key={order.id} className="hover:bg-ink-800/30">
                  <td className="py-3 pr-4">
                    <Link to={`/admin/orders/${order.id}`} className="font-mono text-xs font-semibold text-cream-100 hover:text-ember-400">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-cream-200">{order.customerName}</td>
                  <td className="py-3 pr-4 text-ink-300 text-xs">{formatDateTime(order.created_at)}</td>
                  <td className="py-3 pr-4"><StatusBadge status={order.status} /></td>
                  <td className="py-3 pr-4 text-right font-semibold text-cream-50">{formatPrice(Number(order.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
