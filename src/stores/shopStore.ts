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

export const TATIE_SHOP_ID = '40f91c30-2e23-476b-bdd7-5e0605b1f812';

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  id: TATIE_SHOP_ID,
  name: "Tati’e Kitchen",
  timezone: 'Asia/Makassar',
  phone_no: '0812-3456-7890',
  address: 'RT 04, Desa Srinanti, Kec. Sei Menggaris, Kab. Nunukan, Kalimantan Utara',
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
      const parsed = JSON.parse(raw);
      const address = (parsed?.address && !parsed.address.includes('Tamalate'))
        ? parsed.address
        : DEFAULT_SHOP_SETTINGS.address;
      return { ...DEFAULT_SHOP_SETTINGS, ...parsed, address };
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

  fetchShop: async (shopId) => {
    if (!isSupabaseConfigured()) return;
    try {
      set({ isLoading: true });
      let query = supabase.from('shops').select('*');
      const targetId = shopId && shopId !== 'shop-001' ? shopId : TATIE_SHOP_ID;
      query = query.eq('id', targetId);
      const { data, error } = await query.limit(1).maybeSingle();

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
