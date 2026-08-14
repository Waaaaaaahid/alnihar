import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Trash2, CheckCircle2, XCircle, Pencil, Eye, EyeOff, Plus } from 'lucide-react';
import type { Review } from '@/lib/types';
import { fetchAllReviews, updateReview, deleteReview, createReview } from '@/lib/api';
import { Loader, ErrorState, EmptyState } from '@/components/ui/Loader';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { timeAgo, formatDateTime, cn } from '@/lib/utils';

type Filter = 'all' | 'pending' | 'approved' | 'hidden';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'hidden', label: 'Hidden' },
];

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Review | null>(null);
  const [creating, setCreating] = useState(false);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '', name: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setReviews(await fetchAllReviews()); setError(null); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
  }, []);

  // Keep the Reviews panel live while it is open. New customer reviews,
  // approvals, visibility changes and deletions appear without a page refresh.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const toggleApprove = async (r: Review) => {
    try {
      await updateReview(r.id, { isApproved: !r.isApproved });
      showToast(r.isApproved ? 'Review rejected' : 'Review approved', 'success');
      load();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const toggleVisible = async (r: Review) => {
    try {
      await updateReview(r.id, { isVisible: !r.isVisible });
      showToast(r.isVisible ? 'Review hidden from website' : 'Review shown on website', 'success');
      load();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const openEdit = (r: Review) => {
    setEditing(r);
    setEditForm({ rating: r.rating, comment: r.comment, name: r.name });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateReview(editing.id, { rating: editForm.rating, comment: editForm.comment.trim(), name: editForm.name.trim() });
      showToast('Review updated', 'success');
      setEditing(null);
      load();
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleCreate = async () => {
    if (!editForm.name.trim() || !editForm.rating) {
      showToast('Name and rating are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await createReview({ name: editForm.name.trim(), rating: editForm.rating, comment: editForm.comment.trim() });
      showToast('Review created', 'success');
      setCreating(false);
      load();
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteReview(deleteId); showToast('Review deleted', 'success'); setDeleteId(null); load(); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  const filtered = reviews.filter((r) => {
    if (filter === 'approved') return r.isApproved && r.isVisible;
    if (filter === 'hidden') return r.isApproved && !r.isVisible;
    if (filter === 'pending') return !r.isApproved;
    return true;
  });

  const count = (f: Filter) => {
    if (f === 'approved') return reviews.filter((r) => r.isApproved && r.isVisible).length;
    if (f === 'hidden') return reviews.filter((r) => r.isApproved && !r.isVisible).length;
    if (f === 'pending') return reviews.filter((r) => !r.isApproved).length;
    return reviews.length;
  };

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${filter === f.key ? 'bg-ember-500 text-ink-950' : 'border border-ink-700 text-cream-200 hover:bg-ink-800'}`}>
              {f.label} <span className="ml-1 text-xs opacity-70">({count(f.key)})</span>
            </button>
          ))}
        </div>
        <Button onClick={() => { setCreating(true); setEditForm({ rating: 5, comment: '', name: '' }); }}>
          <Plus className="h-4 w-4" /> Add Review
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Star className="h-12 w-12" />} title="No reviews" message="Customer reviews will appear here" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-ink-700/50 bg-ink-900 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ember-500/20 text-sm font-bold text-ember-400">{r.name.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-cream-100 text-sm">{r.name}</p>
                    <p className="text-xs text-ink-400" title={formatDateTime(r.createdAt)}>{timeAgo(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={j < r.rating ? 'h-3.5 w-3.5 fill-gold-500 text-gold-500' : 'h-3.5 w-3.5 text-ink-600'} />
                  ))}
                </div>
              </div>

              {r.order && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-300">
                  <span className="rounded-lg bg-ink-800 px-2 py-1 font-mono font-semibold text-cream-200">#{r.order.orderNumber}</span>
                  <span className="text-ink-400">Order placed by {r.order.customerName || r.name}</span>
                </div>
              )}

              <p className="mt-3 text-sm text-cream-200">"{r.comment}"</p>

              <div className="mt-4 flex items-center gap-2">
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                  r.isApproved && r.isVisible ? 'bg-emerald-500/15 text-emerald-400'
                  : r.isApproved ? 'bg-ink-700 text-ink-300'
                  : 'bg-amber-500/15 text-amber-400')}>
                  {!r.isApproved ? 'Pending' : r.isVisible ? 'Approved · Visible' : 'Approved · Hidden'}
                </span>
                <div className="ml-auto flex gap-1">
                  <button onClick={() => toggleApprove(r)} className="rounded-lg border border-ink-600 p-2 text-cream-200 hover:bg-ink-800" title={r.isApproved ? 'Reject' : 'Approve'}>
                    {r.isApproved ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => toggleVisible(r)} className="rounded-lg border border-ink-600 p-2 text-cream-200 hover:bg-ink-800" title={r.isVisible ? 'Hide from website' : 'Show on website'}>
                    {r.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => openEdit(r)} className="rounded-lg border border-ink-600 p-2 text-cream-200 hover:bg-ink-800" title="Edit review">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(r.id)} className="rounded-lg border border-red-500/30 p-2 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Review" maxWidth="max-w-md">
        <div className="space-y-4 p-6">
          <Input label="Customer Name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-cream-200">Rating</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} type="button" onClick={() => setEditForm((p) => ({ ...p, rating: i + 1 }))} className="focus:outline-none">
                  <Star className={cn('h-8 w-8 transition-colors', editForm.rating > i ? 'fill-gold-500 text-gold-500' : 'text-ink-600')} />
                </button>
              ))}
            </div>
          </div>
          <Textarea label="Review Text" value={editForm.comment} onChange={(e) => setEditForm((p) => ({ ...p, comment: e.target.value }))} rows={3} />
          <div className="flex gap-3 pt-2">
            <Button fullWidth onClick={handleSaveEdit} loading={saving}>Save</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="Add Review" maxWidth="max-w-md">
        <div className="space-y-4 p-6">
          <Input label="Customer Name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Customer name" />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-cream-200">Rating</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} type="button" onClick={() => setEditForm((p) => ({ ...p, rating: i + 1 }))} className="focus:outline-none">
                  <Star className={cn('h-8 w-8 transition-colors', editForm.rating > i ? 'fill-gold-500 text-gold-500' : 'text-ink-600')} />
                </button>
              ))}
            </div>
          </div>
          <Textarea label="Review Text" value={editForm.comment} onChange={(e) => setEditForm((p) => ({ ...p, comment: e.target.value }))} rows={3} placeholder="Review text" />
          <div className="flex gap-3 pt-2">
            <Button fullWidth onClick={handleCreate} loading={saving}>Create Review</Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Review" maxWidth="max-w-sm">
        <div className="p-6">
          <p className="text-sm text-ink-300">Delete this review? This cannot be undone.</p>
          <div className="mt-6 flex gap-3">
            <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
