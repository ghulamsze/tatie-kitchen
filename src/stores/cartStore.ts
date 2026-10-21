import { create } from 'zustand';
import { MenuItem, Order, OrderItem } from '../lib/supabase/types.ts';

export interface CartLine {
  item: MenuItem;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  notes: string;
  tableNo: string;
  cashReceived: number;
  lastOrder: Order | null;
  lastOrderItems: OrderItem[];

  addItem: (item: MenuItem) => void;
  updateQty: (itemId: string, delta: number) => void;
  removeItem: (itemId: string) => void;
  setNotes: (notes: string) => void;
  setTableNo: (tableNo: string) => void;
  setCashReceived: (amount: number) => void;
  calculateTotal: () => number;
  clearCart: () => void;
  setLastOrder: (order: Order, items: OrderItem[]) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  notes: '',
  tableNo: '',
  cashReceived: 0,
  lastOrder: null,
  lastOrderItems: [],

  addItem: (item) => {
    if (!item.available) return; // Menu habis tidak bisa ditambahkan

    set((state) => {
      const existing = state.lines.find((l) => l.item.id === item.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l
          ),
        };
      }
      return {
        lines: [...state.lines, { item, qty: 1 }],
      };
    });
  },

  updateQty: (itemId, delta) => {
    set((state) => {
      const target = state.lines.find((l) => l.item.id === itemId);
      if (!target) return state;

      const newQty = target.qty + delta;
      if (newQty <= 0) {
        return {
          lines: state.lines.filter((l) => l.item.id !== itemId),
        };
      }

      return {
        lines: state.lines.map((l) =>
          l.item.id === itemId ? { ...l, qty: newQty } : l
        ),
      };
    });
  },

  removeItem: (itemId) => {
    set((state) => ({
      lines: state.lines.filter((l) => l.item.id !== itemId),
    }));
  },

  setNotes: (notes) => set({ notes }),
  setTableNo: (tableNo) => set({ tableNo }),
  setCashReceived: (amount) => set({ cashReceived: amount }),

  calculateTotal: () => {
    const { lines } = get();
    return lines.reduce((acc, l) => acc + l.item.price_idr * l.qty, 0);
  },

  clearCart: () =>
    set({
      lines: [],
      notes: '',
      tableNo: '',
      cashReceived: 0,
    }),

  setLastOrder: (order, items) =>
    set({
      lastOrder: order,
      lastOrderItems: items,
    }),
}));
