import { create } from 'zustand';
import { Cashier } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';
import { formatTime } from '../lib/format/formatters.ts';

// Data kasir awal acuan dari seed / HTML
const DEFAULT_CASHIERS: Cashier[] = [
  {
    id: 'c-001',
    shop_id: 'shop-001',
    name: 'Robertus Amaresi',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c-002',
    shop_id: 'shop-001',
    name: 'Puspitawati',
    active: true,
    created_at: new Date().toISOString(),
  },
];

interface CashierState {
  cashiers: Cashier[];
  activeCashier: Cashier | null;
  shiftStartTime: string;
  isLoading: boolean;
  fetchCashiers: (shopId?: string) => Promise<void>;
  setActiveCashier: (cashier: Cashier | null) => void;
  addNewCashier: (name: string, shopId?: string) => Promise<Cashier>;
  removeCashier: (id: string) => Promise<void>;
}

export const useCashierStore = create<CashierState>((set) => ({
  cashiers: DEFAULT_CASHIERS,
  activeCashier: null,
  shiftStartTime: '08.00',
  isLoading: false,

  fetchCashiers: async (shopId) => {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      set({ isLoading: true });
      let query = supabase.from('cashiers').select('*').eq('active', true);
      if (shopId) {
        query = query.eq('shop_id', shopId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        set({ cashiers: data as Cashier[] });
      }
    } catch {
      // Fallback ke default kasir
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveCashier: (cashier) => {
    set({
      activeCashier: cashier,
      shiftStartTime: formatTime(new Date()).split(' ')[0], // ambil jam.menit
    });
    try {
      if (cashier) {
        localStorage.setItem('tk-active-cashier-id', cashier.id);
      } else {
        localStorage.removeItem('tk-active-cashier-id');
      }
    } catch {
      // ignore
    }
  },

  addNewCashier: async (name, shopId = 'shop-001') => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama kasir tidak boleh kosong.');

    if (isSupabaseConfigured()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('add_cashier', {
          p_shop_id: shopId,
          p_name: trimmed,
        });
        if (!error && data) {
          const newCashier = data as Cashier;
          set((state) => ({ cashiers: [...state.cashiers, newCashier] }));
          return newCashier;
        }
      } catch {
        // Lanjut ke pembuatan lokal jika error
      }
    }

    // Pembuatan lokal fallback
    const localCashier: Cashier = {
      id: 'c-' + Math.random().toString(36).substring(2, 9),
      shop_id: shopId,
      name: trimmed,
      active: true,
      created_at: new Date().toISOString(),
    };

    set((state) => ({ cashiers: [...state.cashiers, localCashier] }));
    return localCashier;
  },

  removeCashier: async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('cashiers') as any).update({ active: false }).eq('id', id);
      } catch {
        // Fallback local
      }
    }

    set((state) => {
      const remaining = state.cashiers.filter((c) => c.id !== id);
      const isCurrentActive = state.activeCashier?.id === id;
      if (isCurrentActive) {
        try {
          localStorage.removeItem('tk-active-cashier-id');
        } catch {
          // ignore
        }
      }
      return {
        cashiers: remaining,
        activeCashier: isCurrentActive ? (remaining[0] ?? null) : state.activeCashier,
      };
    });
  },
}));
