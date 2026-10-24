import { create } from 'zustand';
import { Order, OrderItem } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';
import { logError } from '../lib/logger/logger.ts';
import { broadcastOrderCreated } from '../lib/supabase/realtime.ts';

export interface HistoryOrderWithItems {
  order: Order;
  items: OrderItem[];
}

export type DateRangePreset = 'hari-ini' | 'kemarin' | '7-hari' | '30-hari' | 'semua';

// Riwayat transaksi default dikosongkan sesuai permintaan
export const SEED_HISTORY_ORDERS: HistoryOrderWithItems[] = [];

const HISTORY_RESET_KEY = 'tk_history_reset_20261024_v2';

const loadSavedOrders = (): HistoryOrderWithItems[] => {
  try {
    // Lakukan reset untuk menghapus seluruh data riwayat transaksi lama di semua rentang waktu
    if (typeof localStorage !== 'undefined') {
      if (!localStorage.getItem(HISTORY_RESET_KEY)) {
        localStorage.removeItem('tk_order_history');
        localStorage.setItem(HISTORY_RESET_KEY, 'true');
        return [];
      }
      const raw = localStorage.getItem('tk_order_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    logError('historyStore:loadSavedOrders', err);
  }
  return SEED_HISTORY_ORDERS;
};

interface HistoryState {
  orders: HistoryOrderWithItems[];
  selectedRange: DateRangePreset;
  selectedOrder: HistoryOrderWithItems | null;

  setRange: (range: DateRangePreset) => void;
  setSelectedOrder: (order: HistoryOrderWithItems | null) => void;
  addOrder: (order: Order, items: OrderItem[]) => void;
  clearHistory: () => void;
  fetchOrders: (shopId?: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  orders: loadSavedOrders(),
  selectedRange: 'hari-ini',
  selectedOrder: null,

  setRange: (range) => set({ selectedRange: range }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),

  clearHistory: () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('tk_order_history');
      }
    } catch (err) {
      logError('historyStore:clearHistory', err);
    }
    set({ orders: [], selectedOrder: null });
  },

  addOrder: (order, items) => {
    set((state) => {
      const updated = [{ order, items }, ...state.orders];
      try {
        localStorage.setItem('tk_order_history', JSON.stringify(updated));
      } catch (err) {
        logError('historyStore:addOrder_persist', err);
      }
      return { orders: updated };
    });
    // Broadcast pembuatan order ke perangkat lain secara real-time
    broadcastOrderCreated(order.id, order.queue_no || 1, order.total_idr).catch(() => {});
  },

  fetchOrders: async (shopId) => {
    if (!isSupabaseConfigured()) return;
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (shopId) {
        query = query.eq('shop_id', shopId);
      }

      const { data, error } = await query;
      if (error) {
        logError('historyStore:fetchOrders_query', error);
      } else if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const remoteOrders: HistoryOrderWithItems[] = data.map((d: any) => ({
          order: {
            id: d.id,
            shop_id: d.shop_id,
            cashier_id: d.cashier_id,
            device_id: d.device_id,
            table_no: d.table_no,
            total_idr: d.total_idr,
            cash_received_idr: d.cash_received_idr,
            change_idr: d.change_idr,
            status: d.status,
            queue_no: d.queue_no,
            business_date: d.business_date,
            created_at: d.created_at,
            payment_method: d.payment_method || 'Tunai',
          },
          items: d.order_items || [],
        }));

        set((state) => {
          // Jika di database Supabase pesanan kosong (direset), bersihkan riwayat lokal
          if (remoteOrders.length === 0) {
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('tk_order_history');
              }
            } catch {
              // ignore
            }
            return { orders: [], selectedOrder: null };
          }

          // Gabungkan pesanan remote dari Supabase dengan pesanan lokal offline yang belum tersinkron
          const remoteIds = new Set(remoteOrders.map((ro) => ro.order.id));
          const unsyncedLocal = state.orders.filter((lo) => !remoteIds.has(lo.order.id));
          const merged = [...unsyncedLocal, ...remoteOrders].sort(
            (a, b) => new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime()
          );

          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('tk_order_history', JSON.stringify(merged));
            }
          } catch (err) {
            logError('historyStore:fetchOrders_persist', err);
          }

          return { orders: merged };
        });
      }
    } catch (err) {
      logError('historyStore:fetchOrders_exception', err);
    }
  },
}));
