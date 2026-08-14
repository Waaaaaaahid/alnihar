import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, FolderTree } from 'lucide-react';
import type { Category } from '@/lib/types';
import { fetchAllCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api';
import { Loader, ErrorState, EmptyState } from '@/components/ui/Loader';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { slugify, cn } from '@/lib/utils';

const emptyForm = { name: '', description: '', imageUrl: '', isActive: true, sortOrder: '0' };

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchAllCategories();
      setCategories(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description, imageUrl: cat.imageUrl, isActive: cat.isActive, sortOrder: String(cat.sortOrder) });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        slug: slugify(form.name),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        isActive: form.isActive,
        sortOrder: parseInt(form.sortOrder) || 0,
      };
      if (editing) { await updateCategory(editing.id, data); showToast('Category updated', 'success'); }
      else { await createCategory(data); showToast('Category created', 'success'); }
      setModalOpen(false); load();
    } catch (e: any) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteCategory(deleteId); showToast('Category deleted', 'success'); setDeleteId(null); load(); }
    catch (e: any) { showToast(e.message || 'Failed', 'error'); }
  };

  const toggleActive = async (cat: Category) => {
    try { await updateCategory(cat.id, { isActive: !cat.isActive }); load(); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-300">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Category</Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={<FolderTree className="h-12 w-12" />} title="No categories" message="Create your first category" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-2xl border border-ink-700/50 bg-ink-900">
              <div className="relative aspect-[4/3] bg-ink-800">
                <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                {!cat.isActive && <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60"><span className="rounded-lg bg-ink-900 px-3 py-1 text-xs font-semibold text-ink-300">Hidden</span></div>}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-cream-50 text-sm">{cat.name}</h3>
                  <span className="text-xs text-ink-400">#{cat.sortOrder}</span>
                </div>
                <p className="mt-1 text-xs text-ink-400 line-clamp-2">{cat.description}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(cat)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-600 py-2 text-xs font-medium text-cream-200 hover:bg-ink-800">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => toggleActive(cat)} className="rounded-lg border border-ink-600 px-3 py-2 text-xs text-cream-200 hover:bg-ink-800">
                    {cat.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button onClick={() => setDeleteId(cat.id)} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} maxWidth="max-w-lg">
        <div className="space-y-4 p-6">
          <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Premium Burgers" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
          <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." />
          {form.imageUrl && <div className="aspect-[4/3] overflow-hidden rounded-xl bg-ink-800"><img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" /></div>}
          <Input label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} />
          <button onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))} className={cn('flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium', form.isActive ? 'border-ember-500 bg-ember-500/10 text-ember-400' : 'border-ink-600 text-ink-300')}>
            Active (visible to customers)
            <div className={cn('h-5 w-9 rounded-full p-0.5', form.isActive ? 'bg-ember-500' : 'bg-ink-700')}>
              <div className={cn('h-4 w-4 rounded-full bg-white transition-transform', form.isActive && 'translate-x-4')} />
            </div>
          </button>
          <div className="flex gap-3 pt-2">
            <Button fullWidth onClick={handleSave} loading={saving}>{editing ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Category" maxWidth="max-w-sm">
        <div className="p-6">
          <p className="text-sm text-ink-300">Menu items in this category will remain but lose their category. Continue?</p>
          <div className="mt-6 flex gap-3">
            <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
