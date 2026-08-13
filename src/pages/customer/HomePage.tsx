import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Flame, Truck, Clock, Star, MapPin, Phone, ChevronRight } from 'lucide-react';
import type { MenuItem, Review, Category } from '@/lib/types';
import { fetchFeaturedItems, fetchBestsellerItems, fetchCategories, fetchApprovedReviews } from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import MenuItemCard from '@/components/customer/MenuItemCard';
import ItemDrawer from '@/components/customer/ItemDrawer';
import { SkeletonGrid, ErrorState } from '@/components/ui/Loader';
import { formatPrice } from '@/lib/utils';

export default function HomePage() {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState<MenuItem[]>([]);
  const [bestsellers, setBestsellers] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    Promise.all([fetchFeaturedItems(), fetchBestsellerItems(), fetchCategories(), fetchApprovedReviews()])
      .then(([f, b, c, r]) => {
        setFeatured(f);
        setBestsellers(b);
        setCategories(c);
        setReviews(r);
      })
      .catch((err) => setError(err.message || 'Failed to load'))
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

  const openItem = (item: MenuItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const allItems = [...featured, ...bestsellers];
  const recommended = allItems.filter((i) => i.id !== selectedItem?.id).slice(0, 6);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[100svh] overflow-hidden">
        {/* Background */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img
            src={settings?.heroImageUrl || 'https://images.pexels.com/photos/18987002/pexels-photo-18987002.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
            alt="AL NIHAR premium burgers"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/60" />
        </motion.div>

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 flex min-h-[100svh] items-center"
        >
          <div className="container-wide">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full border border-ember-500/30 bg-ember-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ember-400"
              >
                <Flame className="h-3.5 w-3.5" />
                {settings?.isOpen ? 'Now Open · Order Online' : 'Currently Closed'}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="mt-6 font-display text-display-2xl font-bold text-cream-50"
              >
                BOLD<br />
                <span className="text-gradient-ember">FLAVORS.</span><br />
                SMASHED<br />
                <span className="text-gradient-gold">PERFECT.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6 max-w-md text-lg leading-relaxed text-cream-200"
              >
                {settings?.tagline || 'Premium Burgers, Smashed to Perfection'}. Crafted with the finest ingredients and bold, unforgettable flavors.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  to="/menu"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-ember-500 px-7 py-3.5 text-base font-semibold text-ink-950 transition-all hover:bg-ember-600 hover:shadow-xl hover:shadow-ember-500/30 active:scale-[0.98]"
                >
                  Order Now
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/menu"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-600 bg-ink-900/40 px-7 py-3.5 text-base font-semibold text-cream-100 backdrop-blur transition-all hover:border-cream-300 hover:bg-ink-800/60"
                >
                  Explore Menu
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-12 flex gap-8"
              >
                <div>
                  <div className="font-display text-3xl font-bold text-cream-50">50+</div>
                  <div className="text-xs uppercase tracking-wider text-ink-300">Menu Items</div>
                </div>
                <div className="w-px bg-ink-700" />
                <div>
                  <div className="font-display text-3xl font-bold text-cream-50">4.8★</div>
                  <div className="text-xs uppercase tracking-wider text-ink-300">Rating</div>
                </div>
                <div className="w-px bg-ink-700" />
                <div>
                  <div className="font-display text-3xl font-bold text-cream-50">30min</div>
                  <div className="text-xs uppercase tracking-wider text-ink-300">Delivery</div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-cream-300/30 p-1.5">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-2 w-1 rounded-full bg-cream-300/60"
            />
          </div>
        </motion.div>
      </section>

      {/* Features bar */}
      <section className="border-y border-ink-800 bg-ink-900">
        <div className="container-wide grid grid-cols-1 divide-y divide-ink-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { icon: Flame, title: 'Flame-Grilled', desc: 'Every patty grilled to perfection' },
            { icon: Truck, title: 'Fast Delivery', desc: 'Hot at your door in 30 minutes' },
            { icon: Clock, title: 'Open Late', desc: 'Late night cravings sorted' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 px-6 py-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ember-500/10">
                <f.icon className="h-6 w-6 text-ember-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-cream-100">{f.title}</h3>
                <p className="text-xs text-ink-300">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-24">
        <div className="container-wide">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-500">Browse</span>
              <h2 className="mt-2 font-display text-display-lg font-bold text-cream-50">Categories</h2>
            </div>
            <Link to="/menu" className="hidden items-center gap-1 text-sm font-medium text-ember-400 hover:text-ember-300 sm:flex">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.slice(0, 6).map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/menu/${cat.slug}`}
                    className="group relative block aspect-square overflow-hidden rounded-2xl border border-ink-700/50"
                  >
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm font-semibold text-cream-50 leading-tight">{cat.name}</h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="bg-ink-900 py-16 lg:py-24">
        <div className="container-wide">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-500">Most Loved</span>
            <h2 className="mt-2 font-display text-display-lg font-bold text-cream-50">Bestsellers</h2>
            <p className="mt-3 text-sm text-ink-300">The crowd favorites that keep them coming back</p>
          </div>

          {error ? (
            <ErrorState message={error} />
          ) : loading ? (
            <SkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {bestsellers.slice(0, 4).map((item) => (
                <MenuItemCard key={item.id} item={item} onClick={openItem} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-600 px-6 py-3 text-sm font-semibold text-cream-100 transition-colors hover:border-ember-500 hover:text-ember-400"
            >
              View Full Menu <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      {featured.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container-wide">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">Chef's Pick</span>
                <h2 className="mt-2 font-display text-display-lg font-bold text-cream-50">Featured Items</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.slice(0, 8).map((item) => (
                <MenuItemCard key={item.id} item={item} onClick={openItem} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand Story */}
      <section className="relative overflow-hidden border-y border-ink-800 bg-ink-900">
        <div className="container-wide grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-500">Our Story</span>
            <h2 className="mt-2 font-display text-display-lg font-bold text-cream-50">
              Born from a<br />
              <span className="text-gradient-ember">passion for bold</span><br />
              flavors.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-ink-300">
              AL NIHAR started with a simple idea — that a burger should be an experience, not just a meal. We source the finest cuts, grind fresh daily, and smash every patty on a scorching hot griddle for those crispy, caramelized edges that make our burgers unforgettable.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-300">
              From our signature smashed patties to our loaded fries and thick shakes, every item is crafted with obsessive attention to detail. This isn't fast food. This is premium food, fast.
            </p>
            <div className="mt-8 flex gap-8">
              <div>
                <div className="font-display text-3xl font-bold text-ember-500">100%</div>
                <div className="text-xs uppercase tracking-wider text-ink-300">Fresh Daily</div>
              </div>
              <div>
                <div className="font-display text-3xl font-bold text-gold-500">2019</div>
                <div className="text-xs uppercase tracking-wider text-ink-300">Est.</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-ink-700">
              <img
                src={settings?.storyImageUrl || 'https://images.pexels.com/photos/5779781/pexels-photo-5779781.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
                alt="AL NIHAR kitchen"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl border border-ink-700 bg-ink-950 p-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-ember-500" />
                <span className="text-sm font-semibold text-cream-50">Flame Grilled</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 lg:py-24">
        <div className="container-wide">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">Testimonials</span>
            <h2 className="mt-2 font-display text-display-lg font-bold text-cream-50">What People Say</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-48 rounded-2xl" />
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={j < review.rating ? 'h-4 w-4 fill-gold-500 text-gold-500' : 'h-4 w-4 text-ink-600'} />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-cream-200">"{review.comment}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ember-500/20 text-sm font-bold text-ember-400">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-cream-100">{review.name}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-ink-300">No reviews yet. Be the first to review!</p>
          )}
        </div>
      </section>

      {/* Location/Contact */}
      <section className="border-t border-ink-800 bg-ink-900 py-16 lg:py-24">
        <div className="container-wide">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-500">Visit Us</span>
              <h2 className="mt-2 font-display text-display-lg font-bold text-cream-50">Find Us Here</h2>
              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ember-500/10">
                    <MapPin className="h-5 w-5 text-ember-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-cream-100">Address</h3>
                    <p className="mt-1 text-sm text-ink-300">{settings?.address || '123 Food Street, Mumbai 400050'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ember-500/10">
                    <Phone className="h-5 w-5 text-ember-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-cream-100">Phone</h3>
                    <p className="mt-1 text-sm text-ink-300">{settings?.phone || '+91 98765 43210'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ember-500/10">
                    <Clock className="h-5 w-5 text-ember-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-cream-100">Opening Hours</h3>
                    <div className="mt-1 space-y-0.5">
                      {Object.entries(settings?.openingHours || {}).map(([day, time]) => (
                        <div key={day} className="flex justify-between text-sm text-ink-300">
                          <span className="capitalize">{day}</span>
                          <span>{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-ink-700">
              <iframe
                title="AL NIHAR location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=72.825,19.045,72.845,19.065&layer=mapnik"
                className="h-full min-h-[300px] w-full"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <ItemDrawer item={selectedItem} open={drawerOpen} onClose={() => setDrawerOpen(false)} recommended={recommended} />
    </div>
  );
}
