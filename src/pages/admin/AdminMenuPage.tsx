import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, X, UtensilsCrossed } from 'lucide-react';
import type { MenuItem, Category } from '@/lib/types';
import { fetchMenuItems, fetchAllCategories, createMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/api';
import { Loader, ErrorState, EmptyState } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { formatPrice, cn } from '@/lib/utils';

interface EditForm {
  name: string;
  description: string;
  price: string;
  original_price: string;
  category_id: string;
  image_url: string;
  is_available: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  is_spicy: boolean;
  sort_order: string;
}

const emptyForm: EditForm = {
  name: '', description: '', price: '', original_price: '', category_id: '',
  image_url: '', is_available: true, is_bestseller: false, is_featured: false, is_spicy: false, sort_order: '0',
};

export default function AdminMenuPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<EditForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [itemsData, cats] = await Promise.all([fetchMenuItems(), fetchAllCategories()]);
      setItems(itemsData);
      setCategories(cats);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = items.filter((item) => {
    if (filterCat !== 'all' && item.categoryId !== filterCat) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, category_id: categories[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      original_price: item.originalPrice ? String(item.originalPrice) : '',
      category_id: item.categoryId || '',
      image_url: item.imageUrl,
      is_available: item.isAvailable,
      is_bestseller: item.isBestseller,
      is_featured: item.isFeatured,
      is_spicy: item.isSpicy,
      sort_order: String(item.sortOrder),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      showToast('Name and price are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        original_price: form.originalPrice ? parseFloat(form.originalPrice) : null,
        category_id: form.categoryId || null,
        image_url: form.imageUrl.trim(),
        is_available: form.isAvailable,
        is_bestseller: form.isBestseller,
        is_featured: form.isFeatured,
        is_spicy: form.isSpicy,
        sort_order: parseInt(form.sortOrder) || 0,
      };
      if (editing) {
        await updateMenuItem(editing.id, data);
        showToast('Item updated', 'success');
      } else {
        await createMenuItem(data);
        showToast('Item created', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMenuItem(deleteId);
      showToast('Item deleted', 'success');
      setDeleteId(null);
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Failed to delete', 'error');
    }
  };

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-ink-600 bg-ink-900 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:border-ember-500 focus:outline-none"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-xl border border-ink-600 bg-ink-900 px-4 py-2.5 text-sm text-cream-100 focus:border-ember-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Item</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<UtensilsCrossed className="h-12 w-12" />} title="No items found" message="Add your first menu item" action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Item</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <motion.div key={item.id} layout className="overflow-hidden rounded-2xl border border-ink-700/50 bg-ink-900">
              <div className="relative aspect-[4/3] bg-ink-800">
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  {item.isBestseller && <Badge variant="bestseller" />}
                  {item.isFeatured && <Badge variant="featured" />}
                  {item.isSpicy && <Badge variant="spicy" />}
                </div>
                {!item.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60">
                    <span className="rounded-lg bg-ink-900 px-3 py-1 text-xs font-semibold text-red-400">Unavailable</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-cream-50 text-sm line-clamp-1">{item.name}</h3>
                <p className="mt-1 text-xs text-ink-400 line-clamp-2">{item.description}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-bold text-cream-50">{formatPrice(item.price)}</span>
                  {item.originalPrice && <span className="text-xs text-ink-400 line-through">{formatPrice(item.originalPrice)}</span>}
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(item)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-600 py-2 text-xs font-medium text-cream-200 hover:bg-ink-800">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(item.id)} className="flex items-center justify-center rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit/Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'Add Menu Item'} maxWidth="max-w-xl">
        <div className="space-y-4 p-6">
          <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Item name" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Item description" rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹)" type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="220" />
            <Input label="Original Price (₹)" type="number" value={form.originalPrice} onChange={(e) => setForm((p) => ({ ...p, original_price: e.target.value }))} placeholder="280" />
          </div>
          <Select label="Category" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
          {form.imageUrl && (
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-ink-800">
              <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
          <Input label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} />

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'is_available', label: 'Available' },
              { key: 'is_bestseller', label: 'Bestseller' },
              { key: 'is_featured', label: 'Featured' },
              { key: 'is_spicy', label: 'Spicy' },
            ].map((toggle) => (
              <button
                key={toggle.key}
                onClick={() => setForm((p) => ({ ...p, [toggle.key]: !p[toggle.key as keyof EditForm] }))}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                  form[toggle.key as keyof EditForm] as boolean
                    ? 'border-ember-500 bg-ember-500/10 text-ember-400'
                    : 'border-ink-600 text-ink-300',
                )}
              >
                {toggle.label}
                <div className={cn('h-5 w-9 rounded-full p-0.5 transition-colors', form[toggle.key as keyof EditForm] as boolean ? 'bg-ember-500' : 'bg-ink-700')}>
                  <div className={cn('h-4 w-4 rounded-full bg-white transition-transform', form[toggle.key as keyof EditForm] as boolean && 'translate-x-4')} />
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button fullWidth onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Create Item'}</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Item" maxWidth="max-w-sm">
        <div className="p-6">
          <p className="text-sm text-ink-300">Are you sure you want to delete this menu item? This cannot be undone.</p>
          <div className="mt-6 flex gap-3">
            <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
