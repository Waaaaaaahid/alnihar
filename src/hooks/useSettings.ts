import { useEffect, useState } from 'react';
import type { RestaurantSettings } from '@/lib/types';
import { fetchSettings } from '@/lib/api';

let cachedSettings: RestaurantSettings | null = null;
let fetchPromise: Promise<RestaurantSettings | null> | null = null;

export function useSettings() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) return;
    if (!fetchPromise) {
      fetchPromise = fetchSettings().then((s) => {
        cachedSettings = s;
        return s;
      });
    }
    fetchPromise.then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  return { settings, loading };
}
