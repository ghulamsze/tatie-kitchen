import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';
import { logError } from '../lib/logger/logger.ts';

export interface ShopSettings {
  id: string;
  name: string;
  timezone: string;
  phone_no: string;
  address: string;
  bank_name: string;
  bank_account: string;
  bank_account_holder: string;
  qris_path: string;
}

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  id: 'shop-001',
  name: "Tati’e Kitchen",
  timezone: 'Asia/Makassar',
  phone_no: '0812-3456-7890',
  address: 'Jl. Tamalate 2 No. 8, Makassar',
  bank_name: 'Bank Kaltimtara',
  bank_account: '1747037252',
  bank_account_holder: 'Hartati Jahri',
  qris_path: '/assets/images/qris-clean.png',
};

const STORAGE_KEY = 'tk_shop_settings';

const loadSavedShop = (): ShopSettings => {
  if (typeof window === 'undefined') return DEFAULT_SHOP_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SHOP_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    logError('shopStore:loadSavedShop', err);
  }
  return DEFAULT_SHOP_SETTINGS;
};

interface ShopState {
  shop: ShopSettings;
  isLoading: boolean;
  fetchShop: (shopId?: string) => Promise<void>;
  updateShopSettings: (patch: Partial<ShopSettings>) => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  shop: loadSavedShop(),
  isLoading: false,

  fetchShop: async (shopId = 'shop-001') => {
    if (!isSupabaseConfigured()) return;
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) {
        logError('shopStore:fetchShop_query', error);
      } else if (data) {
        const merged: ShopSettings = {
          ...get().shop,
          ...(data as unknown as Partial<ShopSettings>),
        };
        set({ shop: merged });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch (err) {
          logError('shopStore:persistShop', err);
        }
      }
    } catch (err) {
      logError('shopStore:fetchShop_exception', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateShopSettings: (patch) => {
    set((state) => {
      const updated = { ...state.shop, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        logError('shopStore:updateShopSettings', err);
      }
      return { shop: updated };
    });
  },
}));
