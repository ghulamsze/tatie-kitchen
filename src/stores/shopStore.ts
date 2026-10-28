import { create } from 'zustand';
import { supabase, isSupabaseConfigured, getSupabaseSecretKey } from '../lib/supabase/client.ts';
import { logError } from '../lib/logger/logger.ts';
import { Capacitor } from '@capacitor/core';

const SUPABASE_BASE_URL = 'https://fiaetjtqhvdewqffliai.supabase.co';

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
  owner_name?: string;
  owner_avatar_url?: string;
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
  owner_name: 'Hartati Jahri',
  owner_avatar_url: undefined,
};

const STORAGE_KEY = 'tk_shop_settings';

const loadSavedShop = (): ShopSettings => {
  if (typeof window === 'undefined') return DEFAULT_SHOP_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const savedOwnerAvatar = localStorage.getItem('tk_owner_avatar') || undefined;
    if (raw) {
      const parsed = JSON.parse(raw);
      const address = (parsed?.address && !parsed.address.includes('Tamalate'))
        ? parsed.address
        : DEFAULT_SHOP_SETTINGS.address;
      return {
        ...DEFAULT_SHOP_SETTINGS,
        ...parsed,
        address,
        owner_avatar_url: parsed?.owner_avatar_url || savedOwnerAvatar,
      };
    }
    if (savedOwnerAvatar) {
      return { ...DEFAULT_SHOP_SETTINGS, owner_avatar_url: savedOwnerAvatar };
    }
  } catch (err) {
    logError('shopStore:loadSavedShop', err);
  }
  return DEFAULT_SHOP_SETTINGS;
};

export function removeInvalidOwnerAvatar() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tk_owner_avatar');
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        delete parsed.owner_avatar_url;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
  useShopStore.setState((state) => ({
    shop: { ...state.shop, owner_avatar_url: undefined },
  }));
}

interface ShopState {
  shop: ShopSettings;
  isLoading: boolean;
  fetchShop: (shopId?: string) => Promise<void>;
  updateShopSettings: (patch: Partial<ShopSettings>) => Promise<void>;
  updateOwnerAvatar: (fileOrBlob: Blob | File | string) => Promise<string>;
  removeOwnerAvatar: () => Promise<void>;
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
        const remoteData = data as unknown as Partial<ShopSettings>;
        const merged: ShopSettings = {
          ...get().shop,
          ...remoteData,
          owner_avatar_url: remoteData.owner_avatar_url || get().shop.owner_avatar_url,
        };
        set({ shop: merged });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          if (merged.owner_avatar_url) {
            localStorage.setItem('tk_owner_avatar', merged.owner_avatar_url);
          }
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

  updateShopSettings: async (patch) => {
    set((state) => {
      const updated = { ...state.shop, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        if (patch.owner_avatar_url !== undefined) {
          if (patch.owner_avatar_url) {
            localStorage.setItem('tk_owner_avatar', patch.owner_avatar_url);
          } else {
            localStorage.removeItem('tk_owner_avatar');
          }
        }
      } catch (err) {
        logError('shopStore:updateShopSettings', err);
      }
      return { shop: updated };
    });

    if (isSupabaseConfigured()) {
      try {
        const currentShopId = get().shop.id || TATIE_SHOP_ID;
        // 1. Coba lewat RPC update_shop_profile
        try {
          await (supabase.rpc as any)('update_shop_profile', {
            p_shop_id: currentShopId,
            p_name: patch.name ?? null,
            p_phone_no: patch.phone_no ?? null,
            p_address: patch.address ?? null,
            p_bank_name: patch.bank_name ?? null,
            p_bank_account: patch.bank_account ?? null,
            p_bank_account_holder: patch.bank_account_holder ?? null,
            p_owner_name: patch.owner_name ?? null,
            p_owner_avatar_url: patch.owner_avatar_url ?? null,
          });
        } catch {
          // Fallback direct update
          await (supabase.from('shops') as any)
            .update(patch)
            .eq('id', currentShopId);
        }
      } catch (err) {
        logError('shopStore:updateShopSettings_remote', err);
      }
    }
  },

  updateOwnerAvatar: async (fileOrBlob) => {
    let blob: Blob;
    let instantPreview = '';

    if (typeof fileOrBlob === 'string') {
      instantPreview = fileOrBlob;
      const res = await fetch(fileOrBlob);
      blob = await res.blob();
    } else {
      blob = fileOrBlob;
      instantPreview = URL.createObjectURL(blob);
    }

    // 1. Tampilkan foto secara instan di UI dan simpan cache lokal
    set((state) => {
      const updated = { ...state.shop, owner_avatar_url: instantPreview };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem('tk_owner_avatar', instantPreview);
      } catch {}
      return { shop: updated };
    });

    const targetShopId = get().shop.id || TATIE_SHOP_ID;
    const publicUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/avatars/owner_${targetShopId}.jpg?t=${Date.now()}`;

    // 2. Simpan ke database Supabase Storage & tabel shops
    if (isSupabaseConfigured()) {
      try {
        if (Capacitor.isNativePlatform()) {
          const secretKey = getSupabaseSecretKey();
          await fetch(`${SUPABASE_BASE_URL}/storage/v1/object/avatars/owner_${targetShopId}.jpg`, {
            method: 'POST',
            headers: {
              apikey: secretKey,
              Authorization: `Bearer ${secretKey}`,
              'x-upsert': 'true',
              'Content-Type': blob.type || 'image/jpeg',
            },
            body: blob,
          });
        } else {
          await supabase.storage.from('avatars').upload(`owner_${targetShopId}.jpg`, blob, {
            upsert: true,
            contentType: blob.type || 'image/jpeg',
          });
        }

        // Simpan URL profil pemilik ke tabel shops
        try {
          await (supabase.rpc as any)('update_shop_profile', {
            p_shop_id: targetShopId,
            p_owner_avatar_url: publicUrl,
          });
        } catch {
          await (supabase.from('shops') as any)
            .update({ owner_avatar_url: publicUrl })
            .eq('id', targetShopId);
        }

        set((state) => {
          const updated = { ...state.shop, owner_avatar_url: publicUrl };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem('tk_owner_avatar', publicUrl);
          } catch {
            // ignore
          }
          return { shop: updated };
        });
      } catch (err) {
        logError('shopStore:updateOwnerAvatar_remote', err);
      }
    }

    return publicUrl;
  },

  removeOwnerAvatar: async () => {
    set((state) => {
      const updated = { ...state.shop, owner_avatar_url: undefined };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.removeItem('tk_owner_avatar');
      } catch {
        // ignore
      }
      return { shop: updated };
    });

    if (isSupabaseConfigured()) {
      try {
        const targetShopId = get().shop.id || TATIE_SHOP_ID;
        try {
          await supabase.storage.from('avatars').remove([`owner_${targetShopId}.jpg`]);
        } catch {
          // ignore
        }

        try {
          await (supabase.rpc as any)('update_shop_profile', {
            p_shop_id: targetShopId,
            p_owner_avatar_url: null,
          });
        } catch {
          await (supabase.from('shops') as any)
            .update({ owner_avatar_url: null })
            .eq('id', targetShopId);
        }
      } catch (err) {
        logError('shopStore:removeOwnerAvatar_remote', err);
      }
    }
  },
}));
