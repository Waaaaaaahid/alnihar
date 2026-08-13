import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import type { Review } from '@/lib/types';
import { fetchAllReviews, updateReview, deleteReview } from '@/lib/api';
import { Loader, ErrorState, EmptyState } from '@/components/ui/Loader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { timeAgo } from '@/lib/utils';

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try { setReviews(await fetchAllReviews()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleApprove = async (r: Review) => {
    try { await updateReview(r.id, { is_approved: !r.isApproved }); showToast(r.isApproved ? 'Review hidden' : 'Review approved', 'success'); load(); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteReview(deleteId); showToast('Review deleted', 'success'); setDeleteId(null); load(); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  const filtered = reviews.filter((r) => {
    if (filter === 'approved') return r.isApproved;
    if (filter === 'pending') return !r.isApproved;
    return true;
  });

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'approved', 'pending'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${filter === f ? 'bg-ember-500 text-ink-950' : 'border border-ink-700 text-cream-200 hover:bg-ink-800'}`}>
              {f}
            </button>
          ))}
        </div>
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
                    <p className="text-xs text-ink-400">{timeAgo(r.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={j < r.rating ? 'h-3.5 w-3.5 fill-gold-500 text-gold-500' : 'h-3.5 w-3.5 text-ink-600'} />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-cream-200">"{r.comment}"</p>
              <div className="mt-4 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isApproved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {r.isApproved ? 'Approved' : 'Pending'}
                </span>
                <div className="ml-auto flex gap-1">
                  <button onClick={() => toggleApprove(r)} className="rounded-lg border border-ink-600 p-2 text-cream-200 hover:bg-ink-800" title={r.isApproved ? 'Unapprove' : 'Approve'}>
                    {r.isApproved ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
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
