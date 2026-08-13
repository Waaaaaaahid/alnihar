import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Package, LogOut, Edit2, Save, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fetchUserOrders, updateProfile } from '@/lib/api';
import type { Order } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatPrice, formatDateTime } from '@/lib/utils';

export default function ProfilePage() {
  const { profile, session, signOut, refreshProfile, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.name, phone: profile.phone });
    }
  }, [profile]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserOrders(session.user.id)
        .then(setOrders)
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    } else {
      setOrdersLoading(false);
    }
  }, [session?.user?.id]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      await updateProfile(session.user.id, { full_name: form.name, phone: form.phone });
      await refreshProfile();
      setEditing(false);
      showToast('Profile updated', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="container-narrow py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-cream-50">Sign in to view your profile</h1>
        <Link to="/login" className="mt-4 inline-block rounded-xl bg-ember-500 px-6 py-3 text-sm font-semibold text-ink-950">
          Sign In
        </Link>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled', 'payment_failed'].includes(o.status));
  const pastOrders = orders.filter((o) => ['delivered', 'cancelled', 'payment_failed'].includes(o.status));

  return (
    <div className="container-narrow py-8 lg:py-12">
      <h1 className="mb-8 font-display text-display-lg font-bold text-cream-50">My Profile</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-ember-500 to-ember-700 font-display text-3xl font-bold text-ink-950">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-cream-50">{profile?.name || 'User'}</h2>
              <p className="text-sm text-ink-300">{session?.user?.email}</p>
              {isAdmin && (
                <span className="mt-2 rounded-full bg-ember-500/20 px-3 py-1 text-xs font-semibold text-ember-400">Admin</span>
              )}
            </div>

            {editing ? (
              <div className="mt-6 space-y-4">
                <Input
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
                <Button fullWidth onClick={handleSave} loading={saving}>
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
                <Button fullWidth variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-ink-400" />
                  <span className="text-ink-300">{profile?.name || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-ink-400" />
                  <span className="text-ink-300">{session?.user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-ink-400" />
                  <span className="text-ink-300">{profile?.phone || 'Not set'}</span>
                </div>
                <Button fullWidth variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  size="sm"
                  onClick={() => { signOut(); navigate('/'); }}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active orders */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-50">
              <Package className="h-5 w-5 text-ember-500" /> Active Orders
              {activeOrders.length > 0 && (
                <span className="rounded-full bg-ember-500 px-2 py-0.5 text-xs font-bold text-ink-950">{activeOrders.length}</span>
              )}
            </h3>
            {ordersLoading ? (
              <Loader />
            ) : activeOrders.length === 0 ? (
              <p className="rounded-xl border border-ink-700/50 bg-ink-900 p-6 text-sm text-ink-400">No active orders</p>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/track/${order.id}`}
                    className="block rounded-2xl border border-ember-500/20 bg-ember-500/5 p-4 transition-all hover:bg-ember-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm font-semibold text-cream-50">{order.orderNumber}</span>
                        <p className="mt-0.5 text-xs text-ink-400">{formatDateTime(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="font-bold text-cream-50">{formatPrice(Number(order.total))}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Past orders */}
          <div>
            <h3 className="mb-4 font-display text-lg font-bold text-cream-50">Order History</h3>
            {pastOrders.length === 0 ? (
              <p className="rounded-xl border border-ink-700/50 bg-ink-900 p-6 text-sm text-ink-400">No past orders</p>
            ) : (
              <div className="space-y-3">
                {pastOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/track/${order.id}`}
                    className="block rounded-2xl border border-ink-700/50 bg-ink-900 p-4 transition-all hover:bg-ink-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm font-semibold text-cream-50">{order.orderNumber}</span>
                        <p className="mt-0.5 text-xs text-ink-400">{formatDateTime(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="font-bold text-cream-50">{formatPrice(Number(order.total))}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
