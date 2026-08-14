import { useEffect, useState, useRef, useCallback } from 'react';
import type { Order } from '@/lib/types';
import { fetchAllOrders } from '@/lib/api';

interface UseAdminOrdersOptions {
  onNewOrder?: (order: Order) => void;
<<<<<<< HEAD
  enabled?: boolean;
}

export function useAdminOrders(options: UseAdminOrdersOptions = {}) {
  const { onNewOrder, enabled = true } = options;
=======
}

export function useAdminOrders(options: UseAdminOrdersOptions = {}) {
  const { onNewOrder } = options;
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const loadOrders = useCallback(async () => {
<<<<<<< HEAD
    if (!enabled) return;
=======
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70
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
<<<<<<< HEAD
  }, [onNewOrder, enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
=======
  }, [onNewOrder]);

  useEffect(() => {
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70
    loadOrders();
    pollingRef.current = setInterval(loadOrders, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
<<<<<<< HEAD
  }, [loadOrders, enabled]);
=======
  }, [loadOrders]);
>>>>>>> 9a922357087256e67fe5d9e2a66ae9a1e58eec70

  return { orders, loading, error, reload: loadOrders };
}
