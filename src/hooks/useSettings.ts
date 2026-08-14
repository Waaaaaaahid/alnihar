import { useEffect, useState } from 'react';
import type { RestaurantSettings } from '@/lib/types';
import { fetchSettings } from '@/lib/api';

let cachedSettings: RestaurantSettings | null = null;
let fetchPromise: Promise<RestaurantSettings | null> | null = null;

export function useSettings(pollMs = 30000) {
  const [settings, setSettings] = useState<RestaurantSettings | null>(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    let active = true;

    const load = () => {
      if (!fetchPromise) {
        fetchPromise = fetchSettings().then((s) => {
          cachedSettings = s;
          return s;
        });
      }
      return fetchPromise;
    };

    load().then((s) => {
      if (active) {
        setSettings(s);
        setLoading(false);
      }
    });

    const interval = setInterval(async () => {
      try {
        fetchPromise = fetchSettings();
        const s = await fetchPromise;
        cachedSettings = s;
        if (active) setSettings(s);
      } catch {
        // keep previous settings on transient failures
      }
    }, pollMs);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pollMs]);

  return { settings, loading };
}
