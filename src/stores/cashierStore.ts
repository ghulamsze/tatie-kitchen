import { create } from 'zustand';
import { Cashier } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';
import { formatTime } from '../lib/format/formatters.ts';
import { logError } from '../lib/logger/logger.ts';

// Data kasir awal acuan dari seed / HTML
export const DEFAULT_CASHIERS: Cashier[] = [
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

export const IMMUTABLE_CASHIER_IDS = ['c-001', 'c-002', 'c-1', 'c-2'];

export const isImmutableCashier = (id: string, name?: string): boolean => {
  if (IMMUTABLE_CASHIER_IDS.includes(id)) return true;
  if (name) {
    const trimmed = name.trim().toLowerCase();
    if (trimmed === 'robertus amaresi' || trimmed === 'puspitawati') return true;
  }
  return false;
};

const CASHIER_RESET_KEY = 'tk_cashiers_reset_20261023';

const loadSavedCashiers = (): Cashier[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      if (!localStorage.getItem(CASHIER_RESET_KEY)) {
        localStorage.setItem('tk_cashiers', JSON.stringify(DEFAULT_CASHIERS));
        localStorage.setItem(CASHIER_RESET_KEY, 'true');
        return DEFAULT_CASHIERS;
      }
      const raw = localStorage.getItem('tk_cashiers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (err) {
    logError('cashierStore:loadSavedCashiers', err);
  }
  return DEFAULT_CASHIERS;
};

interface CashierState {
  cashiers: Cashier[];
  activeCashier: Cashier | null;
  shiftStartTime: string;
  isLoading: boolean;
  fetchCashiers: (shopId?: string) => Promise<void>;
  setActiveCashier: (cashier: Cashier | null) => void;
  addNewCashier: (name: string, shopId?: string) => Promise<Cashier>;
  removeCashier: (id: string) => Promise<void>;
  resetToDefaultCashiers: () => void;
}


export const useCashierStore = create<CashierState>((set) => ({
  cashiers: loadSavedCashiers(),
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
      if (error) {
        logError('cashierStore:fetchCashiers_query', error);
      } else if (data && data.length > 0) {
        set({ cashiers: data as Cashier[] });
      }
    } catch (err) {
      logError('cashierStore:fetchCashiers_exception', err);
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
    } catch (err) {
      logError('cashierStore:setActiveCashier_persist', err);
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
        if (error) {
          logError('cashierStore:add_cashier_rpc_error', error);
        } else if (data) {
          const newCashier = data as Cashier;
          set((state) => ({ cashiers: [...state.cashiers, newCashier] }));
          return newCashier;
        }
      } catch (err) {
        logError('cashierStore:add_cashier_rpc_exception', err);
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

    set((state) => {
      const updated = [...state.cashiers, localCashier];
      try {
        localStorage.setItem('tk_cashiers', JSON.stringify(updated));
      } catch (err) {
        logError('cashierStore:addNewCashier_persist', err);
      }
      return { cashiers: updated };
    });
    return localCashier;
  },

  removeCashier: async (id: string) => {
    // Robertus Amaresi dan Puspitawati adalah kasir default yang tidak dapat dihapus
    const currentList = useCashierStore.getState().cashiers;
    const target = currentList.find((c) => c.id === id);
    if (isImmutableCashier(id, target?.name)) {
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('cashiers') as any).update({ active: false }).eq('id', id);
        if (error) {
          logError('cashierStore:removeCashier_db_error', error);
        }
      } catch (err) {
        logError('cashierStore:removeCashier_db_exception', err);
      }
    }

    set((state) => {
      const remaining = state.cashiers.filter((c) => c.id !== id);
      const isCurrentActive = state.activeCashier?.id === id;
      try {
        localStorage.setItem('tk_cashiers', JSON.stringify(remaining));
        if (isCurrentActive) {
          localStorage.removeItem('tk-active-cashier-id');
        }
      } catch (err) {
        logError('cashierStore:removeCashier_persist', err);
      }
      return {
        cashiers: remaining,
        activeCashier: isCurrentActive ? (remaining[0] ?? null) : state.activeCashier,
      };
    });
  },

  resetToDefaultCashiers: () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tk_cashiers', JSON.stringify(DEFAULT_CASHIERS));
      }
    } catch (err) {
      logError('cashierStore:resetToDefaultCashiers', err);
    }
    set({
      cashiers: DEFAULT_CASHIERS,
      activeCashier: DEFAULT_CASHIERS[0],
    });
  },

}));
