import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, TicketPercent } from 'lucide-react';
import type { Coupon } from '@/lib/types';
import { fetchAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/lib/api';
import { Loader, ErrorState, EmptyState } from '@/components/ui/Loader';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { formatPrice, formatDate, cn } from '@/lib/utils';

const emptyForm = {
  code: '', description: '', discount_type: 'percentage', discount_value: '',
  min_order: '0', max_discount: '', is_active: true, expires_at: '', usage_limit: '',
};

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    try { setCoupons(await fetchAllCoupons()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, description: c.description, discount_type: c.discountType,
      discount_value: String(c.discountValue), min_order: String(c.minOrder),
      max_discount: c.maxDiscount ? String(c.maxDiscount) : '', is_active: c.isActive,
      expires_at: c.expiresAt ? c.expiresAt.slice(0, 10) : '', usage_limit: c.usageLimit ? String(c.usageLimit) : '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.discountValue) { showToast('Code and discount value are required', 'error'); return; }
    setSaving(true);
    try {
      const data = {
        code: form.code.toUpperCase(),
        description: form.description.trim(),
        discount_type: form.discountType as 'percentage' | 'fixed',
        discount_value: parseFloat(form.discountValue) || 0,
        min_order: parseFloat(form.minOrder) || 0,
        max_discount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        is_active: form.isActive,
        expires_at: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        usage_limit: form.usageLimit ? parseInt(form.usageLimit) : null,
      };
      if (editing) { await updateCoupon(editing.id, data); showToast('Coupon updated', 'success'); }
      else { await createCoupon(data); showToast('Coupon created', 'success'); }
      setModalOpen(false); load();
    } catch (e: any) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteCoupon(deleteId); showToast('Coupon deleted', 'success'); setDeleteId(null); load(); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-300">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Coupon</Button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState icon={<TicketPercent className="h-12 w-12" />} title="No coupons" message="Create your first coupon" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-ink-700/50 bg-ink-900 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-ember-500/20 px-2 py-1 font-mono text-sm font-bold text-ember-400">{c.code}</span>
                    {!c.isActive && <span className="text-xs text-ink-400">Inactive</span>}
                  </div>
                  <p className="mt-2 text-xs text-ink-300">{c.description}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-cream-100"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteId(c.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-ink-400">Discount</span><span className="text-cream-200 font-medium">{c.discountType === 'percentage' ? `${c.discountValue}%` : formatPrice(c.discountValue)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Min Order</span><span className="text-cream-200">{formatPrice(c.minOrder)}</span></div>
                {c.maxDiscount && <div className="flex justify-between"><span className="text-ink-400">Max Discount</span><span className="text-cream-200">{formatPrice(c.maxDiscount)}</span></div>}
                <div className="flex justify-between"><span className="text-ink-400">Used</span><span className="text-cream-200">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</span></div>
                {c.expiresAt && <div className="flex justify-between"><span className="text-ink-400">Expires</span><span className={cn(new Date(c.expiresAt) < new Date() ? 'text-red-400' : 'text-cream-200')}>{formatDate(c.expiresAt)}</span></div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'Add Coupon'} maxWidth="max-w-lg">
        <div className="space-y-4 p-6">
          <Input label="Coupon Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="NIHAR10" />
          <Input label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="10% off your order" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Discount Type" value={form.discountType} onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </Select>
            <Input label="Discount Value" type="number" value={form.discountValue} onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))} placeholder="10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Order (₹)" type="number" value={form.minOrder} onChange={(e) => setForm((p) => ({ ...p, min_order: e.target.value }))} />
            <Input label="Max Discount (₹)" type="number" value={form.maxDiscount} onChange={(e) => setForm((p) => ({ ...p, max_discount: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Expires At" type="date" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))} />
            <Input label="Usage Limit" type="number" value={form.usageLimit} onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))} placeholder="Optional" />
          </div>
          <button onClick={() => setForm((p) => ({ ...p, is_active: !p.isActive }))} className={cn('flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium', form.isActive ? 'border-ember-500 bg-ember-500/10 text-ember-400' : 'border-ink-600 text-ink-300')}>
            Active
            <div className={cn('h-5 w-9 rounded-full p-0.5', form.isActive ? 'bg-ember-500' : 'bg-ink-700')}><div className={cn('h-4 w-4 rounded-full bg-white transition-transform', form.isActive && 'translate-x-4')} /></div>
          </button>
          <div className="flex gap-3 pt-2">
            <Button fullWidth onClick={handleSave} loading={saving}>{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Coupon" maxWidth="max-w-sm">
        <div className="p-6">
          <p className="text-sm text-ink-300">Delete this coupon? This cannot be undone.</p>
          <div className="mt-6 flex gap-3">
            <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
