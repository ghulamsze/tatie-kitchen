import { useEffect, useState, useMemo } from 'react';
import { useHistoryStore, HistoryOrderWithItems } from '../../../stores/historyStore.ts';
import { useShopStore } from '../../../stores/shopStore.ts';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client.ts';
import { getShopTodayDateStr } from '../../../lib/format/formatters.ts';
import { logError } from '../../../lib/logger/logger.ts';

export interface UseLiveOrdersReturn {
  orders: HistoryOrderWithItems[];
  todayOrders: HistoryOrderWithItems[];
  recentOrders: HistoryOrderWithItems[];
  totalOmzet: number;
  totalCount: number;
  isLoading: boolean;
  isRealtimeActive: boolean;
  refresh: () => Promise<void>;
}

export function useLiveOrders(): UseLiveOrdersReturn {
  const { orders, fetchOrders } = useHistoryStore();
  const shopId = useShopStore((state) => state.shop.id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);

  // Ambil data pesanan terbaru di background saat pertama dibuka
  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchOrders(shopId).catch((err) => {
        logError('useLiveOrders:initFetch', err);
      });
    }
  }, [shopId, fetchOrders]);

  // Langganan Supabase Postgres Realtime (orders)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupChannel = () => {
      const channelName = `shop:${shopId}:orders_realtime_${Date.now()}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `shop_id=eq.${shopId}`,
          },
          async () => {
            // Ketika ada transaksi baru dari tablet, ambil data pesanan terbaru beserta itemnya
            try {
              await fetchOrders(shopId);
            } catch (err) {
              logError('useLiveOrders:realtime_fetch', err);
            }
          }
        )
        .subscribe((status) => {
          setIsRealtimeActive(status === 'SUBSCRIBED');
        });
    };

    // Lifecycle: Pause realtime saat aplikasi di background HP untuk hemat baterai & data
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!channel) setupChannel();
      } else {
        if (channel) {
          channel.unsubscribe().catch(() => {});
          channel = null;
          setIsRealtimeActive(false);
        }
      }
    };

    if (document.visibilityState === 'visible') {
      setupChannel();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) {
        channel.unsubscribe().catch(() => {});
      }
    };
  }, [shopId, fetchOrders]);

  const todayStr = getShopTodayDateStr();

  // Transaksi hari ini
  const todayOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = o.order.created_at ? o.order.created_at.split('T')[0] : '';
      return orderDate === todayStr;
    });
  }, [orders, todayStr]);

  // Kalkulasi total omzet dan jumlah transaksi
  const totalOmzet = useMemo(() => {
    return todayOrders.reduce((sum, item) => sum + (item.order.total_idr || 0), 0);
  }, [todayOrders]);

  const totalCount = todayOrders.length;

  // 4 transaksi terbaru (prioritas hari ini, jika kosong tampilkan riwayat terbaru)
  const recentOrders = useMemo(() => {
    const list = todayOrders.length > 0 ? todayOrders : orders;
    return list.slice(0, 4);
  }, [todayOrders, orders]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      await fetchOrders(shopId);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    orders,
    todayOrders,
    recentOrders,
    totalOmzet,
    totalCount,
    isLoading,
    isRealtimeActive,
    refresh,
  };
}
