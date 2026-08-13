import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Store, Clock, Truck, Percent } from 'lucide-react';
import type { RestaurantSettings } from '@/lib/types';
import { fetchSettings, updateSettings } from '@/lib/api';
import { Loader, ErrorState } from '@/components/ui/Loader';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSettings()
      .then((s) => { setSettings(s); setForm(s || {}); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));
  const updateHours = (day: string, value: string) => {
    setForm((p) => ({ ...p, opening_hours: { ...(p.openingHours || {}), [day]: value } }));
  };
  const updateSocial = (key: string, value: string) => {
    setForm((p) => ({ ...p, social_links: { ...(p.socialLinks || {}), [key]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { id, created_at, updated_at, ...updates } = form;
      await updateSettings(updates);
      showToast('Settings saved', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader size="lg" className="py-20" />;
  if (error) return <ErrorState message={error} />;
  if (!settings) return <ErrorState message="Settings not found" />;

  return (
    <div className="space-y-6">
      {/* Restaurant Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-50"><Store className="h-5 w-5 text-ember-500" /> Restaurant Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Restaurant Name" value={form.name || ''} onChange={(e) => update('name', e.target.value)} />
          <Input label="Tagline" value={form.tagline || ''} onChange={(e) => update('tagline', e.target.value)} />
          <Input label="Phone" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
          <Input label="Email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Address" value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
          </div>
          <Input label="Logo URL" value={form.logoUrl || ''} onChange={(e) => update('logo_url', e.target.value)} />
          <Input label="Hero Image URL" value={form.heroImageUrl || ''} onChange={(e) => update('hero_image_url', e.target.value)} />
          <Input label="Story Image URL" value={form.storyImageUrl || ''} onChange={(e) => update('story_image_url', e.target.value)} />
        </div>
        <button
          onClick={() => update('is_open', !form.isOpen)}
          className={cn('mt-4 flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium w-full', form.isOpen ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-ink-600 text-ink-300')}
        >
          {form.isOpen ? 'Restaurant Open' : 'Restaurant Closed'}
          <div className={cn('h-5 w-9 rounded-full p-0.5', form.isOpen ? 'bg-emerald-500' : 'bg-ink-700')}>
            <div className={cn('h-4 w-4 rounded-full bg-white transition-transform', form.isOpen && 'translate-x-4')} />
          </div>
        </button>
      </motion.div>

      {/* Hours */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-50"><Clock className="h-5 w-5 text-ember-500" /> Opening Hours</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DAYS.map((day) => (
            <Input key={day} label={day.charAt(0).toUpperCase() + day.slice(1)} value={form.openingHours?.[day] || ''} onChange={(e) => updateHours(day, e.target.value)} placeholder="11:00 AM - 11:00 PM" />
          ))}
        </div>
      </motion.div>

      {/* Fees */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-50"><Truck className="h-5 w-5 text-ember-500" /> Delivery & Tax</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Delivery Charge (₹)" type="number" value={String(form.deliveryCharge || 0)} onChange={(e) => update('delivery_charge', parseFloat(e.target.value) || 0)} />
          <Input label="Tax Rate (%)" type="number" value={String(form.taxRate || 0)} onChange={(e) => update('tax_rate', parseFloat(e.target.value) || 0)} />
        </div>
      </motion.div>

      {/* Social */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-ink-700/50 bg-ink-900 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-cream-50">Social Links</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Instagram" value={form.socialLinks?.instagram || ''} onChange={(e) => updateSocial('instagram', e.target.value)} />
          <Input label="Facebook" value={form.socialLinks?.facebook || ''} onChange={(e) => updateSocial('facebook', e.target.value)} />
          <Input label="Twitter" value={form.socialLinks?.twitter || ''} onChange={(e) => updateSocial('twitter', e.target.value)} />
        </div>
      </motion.div>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} loading={saving}><Save className="h-4 w-4" /> Save Settings</Button>
      </div>
    </div>
  );
}
