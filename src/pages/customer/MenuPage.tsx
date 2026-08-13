import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { MenuItem, Category } from '@/lib/types';
import { fetchMenuItems, fetchCategories } from '@/lib/api';
import MenuItemCard from '@/components/customer/MenuItemCard';
import ItemDrawer from '@/components/customer/ItemDrawer';
import { SkeletonGrid, ErrorState, EmptyState } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';

export default function MenuPage() {
  const { category: activeSlug } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterAvailable, setFilterAvailable] = useState(false);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchMenuItems()])
      .then(([cats, menuItems]) => {
        setCategories(cats);
        setItems(menuItems);
      })
      .catch((err) => setError(err.message || 'Failed to load menu'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const item = (e as CustomEvent<MenuItem>).detail;
      setSelectedItem(item);
      setDrawerOpen(true);
    };
    window.addEventListener('open-item', handler);
    return () => window.removeEventListener('open-item', handler);
  }, []);

  const activeCategory = categories.find((c) => c.slug === activeSlug);

  const filteredItems = items.filter((item) => {
    if (filterAvailable && !item.isAvailable) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.description.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (activeSlug && activeSlug !== 'all') {
      return item.category?.slug === activeSlug;
    }
    return true;
  });

  const groupedItems = activeSlug && activeSlug !== 'all'
    ? { [activeCategory?.name || '']: filteredItems }
    : filteredItems.reduce((acc, item) => {
        const catName = item.category?.name || 'Other';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(item);
        return acc;
      }, {} as Record<string, MenuItem[]>);

  const openItem = (item: MenuItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const recommended = items.filter((i) => i.id !== selectedItem?.id && i.isAvailable).slice(0, 6);

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Header */}
      <div className="border-b border-ink-800 bg-ink-900">
        <div className="container-wide py-8 lg:py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-500">Full Menu</span>
            <h1 className="mt-2 font-display text-display-xl font-bold text-cream-50">
              {activeCategory ? activeCategory.name : 'Explore Our Menu'}
            </h1>
            <p className="mt-2 text-sm text-ink-300">
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} available
            </p>
          </motion.div>

          {/* Search and filter */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search burgers, fries, shakes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-ink-600 bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-500/30"
              />
            </div>
            <button
              onClick={() => setFilterAvailable((v) => !v)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
                filterAvailable
                  ? 'border-ember-500 bg-ember-500/10 text-ember-400'
                  : 'border-ink-600 text-cream-200 hover:bg-ink-800',
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Available Only
            </button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-16 z-30 border-b border-ink-800 bg-ink-950/95 backdrop-blur-lg lg:top-20">
        <div className="container-wide py-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => navigate('/menu')}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                !activeSlug || activeSlug === 'all'
                  ? 'bg-ember-500 text-ink-950'
                  : 'border border-ink-700 text-cream-200 hover:bg-ink-800',
              )}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/menu/${cat.slug}`)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  activeSlug === cat.slug
                    ? 'bg-ember-500 text-ink-950'
                    : 'border border-ink-700 text-cream-200 hover:bg-ink-800',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="container-wide py-8 lg:py-12">
        {error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : loading ? (
          <SkeletonGrid count={8} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<Search className="h-12 w-12" />}
            title="No items found"
            message={search ? `No results for "${search}"` : 'No items in this category yet'}
          />
        ) : (
          <div className="space-y-12">
            <AnimatePresence mode="wait">
              {Object.entries(groupedItems).map(([catName, catItems]) => (
                <motion.div
                  key={catName}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="mb-5 font-display text-xl font-bold text-cream-50">{catName}</h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {catItems.map((item) => (
                      <MenuItemCard key={item.id} item={item} onClick={openItem} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ItemDrawer item={selectedItem} open={drawerOpen} onClose={() => setDrawerOpen(false)} recommended={recommended} />
    </div>
  );
}
