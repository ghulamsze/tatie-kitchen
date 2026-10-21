import { create } from 'zustand';
import { Order, OrderItem } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';

export interface HistoryOrderWithItems {
  order: Order;
  items: OrderItem[];
}

export type DateRangePreset = 'hari-ini' | 'kemarin' | '7-hari' | '30-hari' | 'semua';

// Contoh data transaksi awal jika belum terhubung ke database
export const SEED_HISTORY_ORDERS: HistoryOrderWithItems[] = [
  {
    order: {
      id: 'ord-101',
      shop_id: 'shop-001',
      cashier_id: 'c-001',
      device_id: null,
      table_no: '4',
      total_idr: 45000,
      cash_received_idr: 50000,
      change_idr: 5000,
      status: 'paid',
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 menit lalu
    },
    items: [
      {
        id: 'oi-101-1',
        order_id: 'ord-101',
        menu_item_id: 'm-01',
        name_snapshot: 'Mie Goreng Komplit',
        price_snapshot_idr: 40000,
        qty: 1,
      },
      {
        id: 'oi-101-2',
        order_id: 'ord-101',
        menu_item_id: 'm-06',
        name_snapshot: 'Es Teh',
        price_snapshot_idr: 5000,
        qty: 1,
      },
    ],
  },
  {
    order: {
      id: 'ord-102',
      shop_id: 'shop-001',
      cashier_id: 'c-001',
      device_id: null,
      table_no: '2',
      total_idr: 35000,
      cash_received_idr: 50000,
      change_idr: 15000,
      status: 'paid',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 jam lalu
    },
    items: [
      {
        id: 'oi-102-1',
        order_id: 'ord-102',
        menu_item_id: 'm-08',
        name_snapshot: 'Nasi Ayam Penyet',
        price_snapshot_idr: 35000,
        qty: 1,
      },
    ],
  },
  {
    order: {
      id: 'ord-103',
      shop_id: 'shop-001',
      cashier_id: 'c-001',
      device_id: null,
      table_no: '7',
      total_idr: 80000,
      cash_received_idr: 100000,
      change_idr: 20000,
      status: 'paid',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Kemarin
    },
    items: [
      {
        id: 'oi-103-1',
        order_id: 'ord-103',
        menu_item_id: 'm-07',
        name_snapshot: 'Nasi Goreng Telur',
        price_snapshot_idr: 20000,
        qty: 2,
      },
      {
        id: 'oi-103-2',
        order_id: 'ord-103',
        menu_item_id: 'm-02',
        name_snapshot: 'Burger Daging',
        price_snapshot_idr: 20000,
        qty: 2,
      },
    ],
  },
];

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
  orders: SEED_HISTORY_ORDERS,
  selectedRange: 'hari-ini',
  selectedOrder: null,

  setRange: (range) => set({ selectedRange: range }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),

  addOrder: (order, items) => {
    set((state) => ({
      orders: [{ order, items }, ...state.orders],
    }));
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
      if (!error && data && data.length > 0) {
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
    } catch {
      // Pertahankan data lokal
    }
  },
}));
