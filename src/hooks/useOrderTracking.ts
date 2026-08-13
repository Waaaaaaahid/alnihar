import { useEffect, useState, useRef, useCallback } from 'react';
import type { Order } from '@/lib/types';
import { fetchOrder } from '@/lib/api';

export function useOrderTracking(orderId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const o = await fetchOrder(orderId);
      setOrder(o);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;

    loadOrder();

    // Polling for real-time updates (every 5 seconds)
    pollingRef.current = setInterval(loadOrder, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [orderId, loadOrder]);

  return { order, loading, error, reload: loadOrder };
}
