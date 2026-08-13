import { useEffect, useState, useRef, useCallback } from 'react';
import type { Order } from '@/lib/types';
import { fetchAllOrders } from '@/lib/api';

export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchAllOrders();
      setOrders(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    // Poll for new orders every 5 seconds (real-time fallback)
    pollingRef.current = setInterval(loadOrders, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [loadOrders]);

  return { orders, loading, error, reload: loadOrders };
}
