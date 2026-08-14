import { useEffect, useState } from 'react';
import type { RestaurantSettings } from '@/lib/types';
import { fetchSettings } from '@/lib/api';

let cachedSettings: RestaurantSettings | null = null;
let fetchPromise: Promise<RestaurantSettings | null> | null = null;

<<<<<<< HEAD
export function useSettings(pollMs = 30000) {
=======
export function useSettings() {
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70
  const [settings, setSettings] = useState<RestaurantSettings | null>(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
<<<<<<< HEAD
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
=======
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
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70

  return { settings, loading };
}
