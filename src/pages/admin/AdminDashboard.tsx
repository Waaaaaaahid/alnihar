import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, IndianRupee, Clock, Flame, CheckCircle2, Users, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { fetchAdminStats, fetchSalesData, type SalesRange } from '@/lib/api';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { useToast } from '@/context/ToastContext';
import type { Order } from '@/lib/types';
import { Loader, ErrorState } from '@/components/ui/Loader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';

const RANGE_OPTIONS: { value: SalesRange; label: string }[] = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 180, label: '6 Months' },
  { value: 365, label: '1 Year' },
];

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [sales, setSales] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [salesRange, setSalesRange] = useState<SalesRange>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNewOrder = useCallback((order: Order) => {
    showToast(`New order received: ${order.orderNumber} — ${formatPrice(Number(order.total))}`, 'info');
  }, [showToast]);

  const { orders, error: ordersError } = useAdminOrders({ onNewOrder: handleNewOrder });
  const recent = orders.slice(0, 6);

  const refreshDashboard = useCallback(async () => {
    try {
      const [s, salesData] = await Promise.all([fetchAdminStats(), fetchSalesData(salesRange)]);
      setStats(s); setSales(salesData); setError(null);
    } catch (e: any) { setError(e.message || 'Failed to load dashboard'); }
    finally { setLoading(false); }
  }, [salesRange]);

  useEffect(() => {
    refreshDashboard();
    const interval = window.setInterval(refreshDashboard, 5000);
    return () => window.clearInterval(interval);
  }, [refreshDashboard]);

  const maxSales = Math.max(...sales.map((s) => Number(s.revenue) || 0), 1);
  const salesTitle = salesRange === 7 ? 'Sales (Last 7 Days)' : salesRange === 30 ? 'Sales (Last 30 Days)' : salesRange === 180 ? 'Sales (Last 6 Months)' : 'Sales (Last 1 Year)';
  const salesData = useMemo(() => sales.map((day) => ({ ...day, label: salesRange >= 180 ? new Date(`${day.date}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) })), [sales, salesRange]);

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error && !stats) return <ErrorState message={error} />;
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

  return (
    <div className="space-y-6">
      {ordersError && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">Live orders temporarily unavailable. Retrying automatically…</div>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-ink-700/50 bg-ink-900 p-5">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', card.bg)}><card.icon className={cn('h-5 w-5', card.color)} /></div>
            <div className="mt-3"><p className="font-display text-2xl font-bold text-cream-50">{card.value}</p><p className="text-xs text-ink-300">{card.label}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-display text-lg font-bold text-cream-50">{salesTitle}</h2><p className="mt-1 text-xs text-ink-400">Live revenue from completed sales data</p></div>
            <select value={salesRange} onChange={(e) => setSalesRange(Number(e.target.value) as SalesRange)} className="rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-xs font-medium text-cream-100 outline-none">
              {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="flex h-56 items-end gap-1 overflow-x-auto pb-1">
            {salesData.map((day, i) => (
              <div key={day.date} className="group relative flex h-full min-w-[30px] flex-1 cursor-pointer flex-col items-center justify-end gap-1" title={`${formatPrice(Number(day.revenue) || 0)} • ${day.orders} orders`}>
                <div className="pointer-events-none absolute bottom-7 z-10 hidden min-w-[110px] -translate-y-1 rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-center text-xs shadow-xl group-hover:block group-focus-within:block">
                  <div className="font-semibold text-cream-50">{formatPrice(Number(day.revenue) || 0)}</div>
                  <div className="mt-0.5 text-[10px] text-ink-400">{day.orders} {day.orders === 1 ? 'order' : 'orders'}</div>
                </div>
                <div className="flex h-full w-full items-end"><motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(4, ((Number(day.revenue) || 0) / maxSales) * 100)}%` }} transition={{ delay: Math.min(i, 12) * 0.03, type: 'spring', stiffness: 100 }} className="w-full rounded-t-md bg-gradient-to-t from-ember-600 to-ember-400" /></div>
                <span className="whitespace-nowrap text-[9px] text-ink-400">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-400"><span>{sales.reduce((sum, s) => sum + s.orders, 0)} paid orders</span><span>{formatPrice(sales.reduce((sum, s) => sum + Number(s.revenue || 0), 0))} sales revenue</span></div>
        </div>

        <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-cream-50">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-ink-300">Available Items</span><span className="font-semibold text-emerald-400">{stats.availableItems}/{stats.totalMenuItems}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-ink-300">Avg Order Value</span><span className="font-semibold text-cream-100">{stats.totalOrders > 0 ? formatPrice(stats.revenue / stats.totalOrders) : '—'}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-ink-300">Completion Rate</span><span className="font-semibold text-cream-100">{stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%</span></div>
          </div>
          <Link to="/admin/orders" className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-ink-600 py-2.5 text-sm font-medium text-cream-200 hover:bg-ink-800">Manage Orders <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold text-cream-50">Recent Orders</h2><p className="text-xs text-ink-400">Updates automatically without refresh</p></div><Link to="/admin/orders" className="text-sm font-medium text-ember-400 hover:text-ember-300">View all</Link></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wider text-ink-400"><th className="pb-3 pr-4 font-medium">Order</th><th className="pb-3 pr-4 font-medium">Customer</th><th className="pb-3 pr-4 font-medium">Date</th><th className="pb-3 pr-4 font-medium">Status</th><th className="pb-3 pr-4 font-medium text-right">Total</th></tr></thead><tbody className="divide-y divide-ink-800">{recent.map((order) => <tr key={order.id} className="hover:bg-ink-800/30"><td className="py-3 pr-4"><Link to={`/admin/orders/${order.id}`} className="font-mono text-xs font-semibold text-cream-100 hover:text-ember-400">{order.orderNumber}</Link></td><td className="py-3 pr-4 text-cream-200">{order.customerName}</td><td className="py-3 pr-4 text-ink-300 text-xs">{formatDateTime(order.createdAt || order.created_at)}</td><td className="py-3 pr-4"><StatusBadge status={order.status} /></td><td className="py-3 pr-4 text-right font-semibold text-cream-50">{formatPrice(Number(order.total))}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
}
