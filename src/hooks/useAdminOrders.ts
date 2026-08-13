import { useEffect, useState, useRef, useCallback } from 'react';
import type { Order } from '@/lib/types';
import { fetchAllOrders } from '@/lib/api';

interface UseAdminOrdersOptions {
  onNewOrder?: (order: Order) => void;
}

export function useAdminOrders(options: UseAdminOrdersOptions = {}) {
  const { onNewOrder } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchAllOrders();
      const newOrders = initializedRef.current
        ? data.filter((order) => !knownIdsRef.current.has(order.id))
        : [];

      knownIdsRef.current = new Set(data.map((order) => order.id));
      initializedRef.current = true;
      setOrders(data);
      setError(null);

      for (const order of newOrders) {
        onNewOrder?.(order);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [onNewOrder]);

  useEffect(() => {
    loadOrders();
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
