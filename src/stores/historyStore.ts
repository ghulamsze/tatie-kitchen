import { create } from 'zustand';
import { Order, OrderItem } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';
import { logError } from '../lib/logger/logger.ts';

export interface HistoryOrderWithItems {
  order: Order;
  items: OrderItem[];
}

export type DateRangePreset = 'hari-ini' | 'kemarin' | '7-hari' | '30-hari' | 'semua';

// Riwayat transaksi default dikosongkan sesuai permintaan
export const SEED_HISTORY_ORDERS: HistoryOrderWithItems[] = [];

const loadSavedOrders = (): HistoryOrderWithItems[] => {
  try {
    const raw = localStorage.getItem('tk_order_history');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
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
  fetchOrders: (shopId?: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  orders: loadSavedOrders(),
  selectedRange: 'hari-ini',
  selectedOrder: null,

  setRange: (range) => set({ selectedRange: range }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),

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
      } else if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: HistoryOrderWithItems[] = data.map((d: any) => ({
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
            created_at: d.created_at,
          },
          items: d.order_items || [],
        }));

        set({ orders: mapped });
      }
    } catch (err) {
      logError('historyStore:fetchOrders_exception', err);
    }
  },
}));
