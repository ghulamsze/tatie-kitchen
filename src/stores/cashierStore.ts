import { create } from 'zustand';
import { Cashier } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';
import { formatTime } from '../lib/format/formatters.ts';
import { logError } from '../lib/logger/logger.ts';
import { broadcastCashierChanged } from '../lib/supabase/realtime.ts';

// Data kasir awal acuan dari seed / HTML
export const DEFAULT_CASHIERS: Cashier[] = [
  {
    id: '1d83083c-9d75-4dec-9c1a-75be69bc1050',
    shop_id: '40f91c30-2e23-476b-bdd7-5e0605b1f812',
    name: 'Robertus Amaresi',
    active: true,
    created_at: '2026-10-21T09:07:13.086159+00:00',
  },
  {
    id: '82f0755f-5d2a-4b5e-bc8e-5f7aa478c27f',
    shop_id: '40f91c30-2e23-476b-bdd7-5e0605b1f812',
    name: 'Puspitawati',
    active: true,
    created_at: '2026-10-21T09:07:13.086159+00:00',
  },
];

export const IMMUTABLE_CASHIER_IDS = [
  '1d83083c-9d75-4dec-9c1a-75be69bc1050',
  '82f0755f-5d2a-4b5e-bc8e-5f7aa478c27f',
  'c-001',
  'c-002',
  'c-1',
  'c-2',
];

export const isImmutableCashier = (id: string, name?: string): boolean => {
  if (IMMUTABLE_CASHIER_IDS.includes(id)) return true;
  if (name) {
    const trimmed = name.trim().toLowerCase();
    if (trimmed === 'robertus amaresi' || trimmed === 'puspitawati') return true;
  }
  return false;
};

export const deduplicateCashiers = (list: Cashier[]): Cashier[] => {
  const seen = new Set<string>();
  return list.filter((c) => {
    const norm = (c.name || '').trim().toLowerCase();
    if (!norm || seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
};

const CASHIER_RESET_KEY = 'tk_cashiers_reset_20261023_v6';

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
        if (Array.isArray(parsed) && parsed.length > 0) return deduplicateCashiers(parsed);
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
      if (shopId && shopId !== 'shop-001') {
        query = query.eq('shop_id', shopId);
      }
      const { data, error } = await query;
      if (error) {
        logError('cashierStore:fetchCashiers_query', error);
      } else if (data && data.length > 0) {
        const unique = deduplicateCashiers(data as Cashier[]);
        set({ cashiers: unique });
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('tk_cashiers', JSON.stringify(unique));
          }
        } catch {
          // ignore
        }
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

    // Broadcast ke device lain secara instan
    broadcastCashierChanged('add', localCashier.id, trimmed).catch(() => {});

    return localCashier;
  },

  removeCashier: async (id: string) => {
    const currentList = useCashierStore.getState().cashiers;
    // Jangan izinkan jika kasir tersisa tinggal 1 agar data kasir tidak kosong
    if (currentList.length <= 1) {
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

    // Broadcast ke seluruh device (Tablet/HP)
    broadcastCashierChanged('remove', id).catch(() => {});

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
