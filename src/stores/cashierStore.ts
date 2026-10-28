import { create } from 'zustand';
import { Cashier } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured, getSupabaseSecretKey } from '../lib/supabase/client.ts';
import { formatTime } from '../lib/format/formatters.ts';
import { logError } from '../lib/logger/logger.ts';
import { broadcastCashierChanged, broadcastCashierAvatarChanged } from '../lib/supabase/realtime.ts';

const SUPABASE_BASE_URL = 'https://fiaetjtqhvdewqffliai.supabase.co';
const CASHIER_AVATARS_KEY = 'tk_cashier_avatars_v2';

export function getLocalCashierAvatars(): Record<string, string> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CASHIER_AVATARS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return {};
}

export function saveLocalCashierAvatar(cashierId: string, avatarUrl: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      const map = getLocalCashierAvatars();
      map[cashierId] = avatarUrl;
      localStorage.setItem(CASHIER_AVATARS_KEY, JSON.stringify(map));
    }
  } catch {}
}

export function removeInvalidCashierAvatar(cashierId: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      const map = getLocalCashierAvatars();
      delete map[cashierId];
      localStorage.setItem(CASHIER_AVATARS_KEY, JSON.stringify(map));
      const saved = localStorage.getItem('tk_cashiers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((c: Cashier) => (c.id === cashierId ? { ...c, avatar_url: undefined } : c));
          localStorage.setItem('tk_cashiers', JSON.stringify(updated));
        }
      }
    }
  } catch {
    // ignore
  }
  useCashierStore.setState((state) => ({
    cashiers: state.cashiers.map((c) => (c.id === cashierId ? { ...c, avatar_url: undefined } : c)),
    activeCashier: state.activeCashier?.id === cashierId ? { ...state.activeCashier, avatar_url: undefined } : state.activeCashier,
  }));
}

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
  const avatars = getLocalCashierAvatars();
  try {
    if (typeof localStorage !== 'undefined') {
      if (!localStorage.getItem(CASHIER_RESET_KEY)) {
        localStorage.setItem('tk_cashiers', JSON.stringify(DEFAULT_CASHIERS));
        localStorage.setItem(CASHIER_RESET_KEY, 'true');
        return DEFAULT_CASHIERS.map((c) => ({ ...c, avatar_url: avatars[c.id] || c.avatar_url }));
      }
      const raw = localStorage.getItem('tk_cashiers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateCashiers(parsed).map((c) => ({
            ...c,
            avatar_url: avatars[c.id] || c.avatar_url,
          }));
        }
      }
    }
  } catch (err) {
    logError('cashierStore:loadSavedCashiers', err);
  }
  return DEFAULT_CASHIERS.map((c) => ({ ...c, avatar_url: avatars[c.id] || c.avatar_url }));
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
  setCashierAvatarLocally: (cashierId: string, avatarUrl: string) => void;
  updateCashierAvatar: (cashierId: string, fileOrDataUrl: Blob | File | string) => Promise<string>;
  deleteCashierAvatar: (cashierId: string) => Promise<void>;
}


export const DEFAULT_SHOP_ID = '40f91c30-2e23-476b-bdd7-5e0605b1f812';

import { Capacitor, CapacitorHttp } from '@capacitor/core';

const REMOVED_CASHIERS_KEY = 'tk_removed_cashiers_v1';

function getRemovedCashierIds(): Set<string> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(REMOVED_CASHIERS_KEY);
      if (raw) return new Set(JSON.parse(raw));
    }
  } catch {}
  return new Set();
}

function markCashierRemovedLocally(id: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      const ids = getRemovedCashierIds();
      ids.add(id);
      localStorage.setItem(REMOVED_CASHIERS_KEY, JSON.stringify(Array.from(ids)));
    }
  } catch {}
}

function unmarkCashierRemovedLocally(id: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      const ids = getRemovedCashierIds();
      ids.delete(id);
      localStorage.setItem(REMOVED_CASHIERS_KEY, JSON.stringify(Array.from(ids)));
    }
  } catch {}
}

export const useCashierStore = create<CashierState>((set) => ({
  cashiers: loadSavedCashiers(),
  activeCashier: null,
  shiftStartTime: '08.00',
  isLoading: false,

  fetchCashiers: async (_shopId) => {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('cashiers')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true });

      if (error) {
        logError('cashierStore:fetchCashiers_query', error);
      } else if (data) {
        const removedIds = getRemovedCashierIds();
        const saved = loadSavedCashiers();
        // Gabungkan data Supabase dengan kasir tersimpan lokal, tanpa kasir yang sudah dihapus
        const combined = [...(data as Cashier[]), ...saved].filter((c) => !removedIds.has(c.id));
        let unique = deduplicateCashiers(combined);

        // Ambil mapping avatar terbaru dari Supabase Storage jika terhubung
        try {
          const { data: files } = await supabase.storage.from('avatars').list('', { limit: 100 });
          if (Array.isArray(files)) {
            const verifiedAvatarMap: Record<string, string> = {};
            files.forEach((f: { name: string; updated_at?: string | null }) => {
              if (!f.name || f.name.startsWith('.')) return;
              const id = f.name.replace(/\.[^/.]+$/, '');
              verifiedAvatarMap[id] = `${SUPABASE_BASE_URL}/storage/v1/object/public/avatars/${f.name}?t=${new Date(f.updated_at || Date.now()).getTime()}`;
            });
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(CASHIER_AVATARS_KEY, JSON.stringify(verifiedAvatarMap));
            }
          }
        } catch {
          // ignore
        }

        const latestAvatars = getLocalCashierAvatars();
        unique = unique.map((c) => ({
          ...c,
          avatar_url: latestAvatars[c.id] || (c.avatar_url?.startsWith('data:') ? c.avatar_url : undefined),
        }));

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

  addNewCashier: async (name, shopId = DEFAULT_SHOP_ID) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama kasir tidak boleh kosong.');

    const tempId = 'c-' + Math.random().toString(36).substring(2, 9);
    const localCashier: Cashier = {
      id: tempId,
      shop_id: shopId,
      name: trimmed,
      active: true,
      created_at: new Date().toISOString(),
    };

    // Update state lokal dan bersihkan dari riwayat hapus
    unmarkCashierRemovedLocally(tempId);
    set((state) => {
      const updated = deduplicateCashiers([...state.cashiers, localCashier]);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('tk_cashiers', JSON.stringify(updated));
        }
      } catch {}
      return { cashiers: updated };
    });

    // Simpan ke Supabase secara native atau REST
    if (isSupabaseConfigured()) {
      try {
        const payload = {
          shop_id: shopId,
          name: trimmed,
          active: true,
        };

        if (Capacitor.isNativePlatform()) {
          // Native Android HTTP request: lolos dari batasan browser user-agent
          const secretKey = getSupabaseSecretKey();
          const res = await CapacitorHttp.request({
            url: 'https://fiaetjtqhvdewqffliai.supabase.co/rest/v1/cashiers',
            method: 'POST',
            headers: {
              apikey: secretKey,
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
              'User-Agent': 'TatieKitchenPOS/1.0',
            },
            data: payload,
          });

          if (res.status === 201 || res.status === 200) {
            const rows = Array.isArray(res.data) ? res.data : [res.data];
            if (rows.length > 0 && rows[0]?.id) {
              const remoteCashier = rows[0] as Cashier;
              set((state) => {
                const updated = deduplicateCashiers(
                  state.cashiers.map((c) => (c.id === tempId ? remoteCashier : c))
                );
                try {
                  localStorage.setItem('tk_cashiers', JSON.stringify(updated));
                } catch {}
                return { cashiers: updated };
              });
              broadcastCashierChanged('add', remoteCashier.id, trimmed).catch(() => {});
              return remoteCashier;
            }
          }
        } else {
          // Browser environment: gunakan Supabase client resmi (Publishable/Anon Key)
          let remoteCashier: Cashier | null = null;

          // 1. Coba lewat RPC add_cashier (SECURITY DEFINER)
          try {
            const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)('add_cashier', {
              p_shop_id: shopId,
              p_name: trimmed,
            });
            if (!rpcErr && rpcData?.id) {
              remoteCashier = rpcData as Cashier;
            }
          } catch {}

          // 2. Fallback insert langsung ke tabel cashiers
          if (!remoteCashier) {
            const { data: inserted, error: insertErr } = await (supabase.from('cashiers') as any)
              .insert(payload)
              .select();

            if (!insertErr && Array.isArray(inserted) && inserted.length > 0) {
              remoteCashier = inserted[0] as Cashier;
            }
          }

          if (remoteCashier) {
            set((state) => {
              const updated = deduplicateCashiers(
                state.cashiers.map((c) => (c.id === tempId ? remoteCashier! : c))
              );
              try {
                localStorage.setItem('tk_cashiers', JSON.stringify(updated));
              } catch {}
              return { cashiers: updated };
            });
            broadcastCashierChanged('add', remoteCashier.id, trimmed).catch(() => {});
            return remoteCashier;
          }
        }
      } catch (err) {
        logError('cashierStore:add_cashier_exception', err);
      }
    }

    // Broadcast ke device lain secara instan
    broadcastCashierChanged('add', localCashier.id, trimmed).catch(() => {});
    return localCashier;
  },

  removeCashier: async (id: string) => {
    const currentList = useCashierStore.getState().cashiers;
    if (currentList.length <= 1) {
      return;
    }

    markCashierRemovedLocally(id);

    // Update state lokal seketika
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

    // Broadcast ke seluruh device (Tablet/HP)
    broadcastCashierChanged('remove', id).catch(() => {});

    if (isSupabaseConfigured()) {
      try {
        if (Capacitor.isNativePlatform()) {
          const secretKey = getSupabaseSecretKey();
          await CapacitorHttp.request({
            url: `https://fiaetjtqhvdewqffliai.supabase.co/rest/v1/cashiers?id=eq.${id}`,
            method: 'PATCH',
            headers: {
              apikey: secretKey,
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'TatieKitchenPOS/1.0',
            },
            data: { active: false },
          });
        } else {
          // 1. Coba RPC remove_cashier (SECURITY DEFINER)
          let rpcSuccess = false;
          try {
            const { error: rpcErr } = await (supabase.rpc as any)('remove_cashier', {
              p_cashier_id: id,
            });
            if (!rpcErr) {
              rpcSuccess = true;
            }
          } catch {}

          // 2. Fallback update langsung ke tabel cashiers
          if (!rpcSuccess) {
            await (supabase.from('cashiers') as any)
              .update({ active: false })
              .eq('id', id);
          }
        }
      } catch (err) {
        logError('cashierStore:removeCashier_rest_exception', err);
      }
    }
  },

  setCashierAvatarLocally: (cashierId, avatarUrl) => {
    if (!avatarUrl) {
      const map = getLocalCashierAvatars();
      delete map[cashierId];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CASHIER_AVATARS_KEY, JSON.stringify(map));
      }
      set((state) => {
        const updated = state.cashiers.map((c) =>
          c.id === cashierId ? { ...c, avatar_url: undefined } : c
        );
        const newActive = state.activeCashier?.id === cashierId
          ? { ...state.activeCashier, avatar_url: undefined }
          : state.activeCashier;
        return { cashiers: updated, activeCashier: newActive };
      });
      return;
    }

    saveLocalCashierAvatar(cashierId, avatarUrl);
    set((state) => {
      const updated = state.cashiers.map((c) =>
        c.id === cashierId ? { ...c, avatar_url: avatarUrl } : c
      );
      const newActive = state.activeCashier?.id === cashierId
        ? { ...state.activeCashier, avatar_url: avatarUrl }
        : state.activeCashier;
      return { cashiers: updated, activeCashier: newActive };
    });
  },

  updateCashierAvatar: async (cashierId, fileOrDataUrl) => {
    let blob: Blob;
    let instantPreview = '';

    if (typeof fileOrDataUrl === 'string') {
      instantPreview = fileOrDataUrl;
      const res = await fetch(fileOrDataUrl);
      blob = await res.blob();
    } else {
      blob = fileOrDataUrl;
      instantPreview = URL.createObjectURL(blob);
    }

    // 1. Tampilkan foto langsung secara instan (0 ms) agar tidak ada jeda / bug broken image
    set((state) => {
      const updated = state.cashiers.map((c) =>
        c.id === cashierId ? { ...c, avatar_url: instantPreview } : c
      );
      const newActive = state.activeCashier?.id === cashierId
        ? { ...state.activeCashier, avatar_url: instantPreview }
        : state.activeCashier;
      return { cashiers: updated, activeCashier: newActive };
    });

    const publicUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/avatars/${cashierId}.jpg?t=${Date.now()}`;

    // 2. Upload ke Supabase Storage (Database)
    try {
      if (Capacitor.isNativePlatform()) {
        const secretKey = getSupabaseSecretKey();
        await fetch(`${SUPABASE_BASE_URL}/storage/v1/object/avatars/${cashierId}.jpg`, {
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
        await supabase.storage.from('avatars').upload(`${cashierId}.jpg`, blob, {
          upsert: true,
          contentType: blob.type || 'image/jpeg',
        });
      }

      // Simpan di local cache
      saveLocalCashierAvatar(cashierId, publicUrl);

      // Sinkronkan ke kolom avatar_url di tabel cashiers jika ada
      try {
        await (supabase.from('cashiers') as any)
          .update({ avatar_url: publicUrl })
          .eq('id', cashierId);
      } catch {}

      // Perbarui dengan public URL setelah upload sukses
      set((state) => {
        const updated = state.cashiers.map((c) =>
          c.id === cashierId ? { ...c, avatar_url: publicUrl } : c
        );
        const newActive = state.activeCashier?.id === cashierId
          ? { ...state.activeCashier, avatar_url: publicUrl }
          : state.activeCashier;
        return { cashiers: updated, activeCashier: newActive };
      });

      // Broadcast perubahan ke seluruh device yang sedang aktif (Tablet & HP)
      await broadcastCashierAvatarChanged(cashierId, publicUrl);
    } catch (err) {
      logError('cashierStore:updateCashierAvatar_upload', err);
    }

    return publicUrl;
  },

  deleteCashierAvatar: async (cashierId) => {
    // 1. Hapus dari state lokal seketika
    const map = getLocalCashierAvatars();
    delete map[cashierId];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CASHIER_AVATARS_KEY, JSON.stringify(map));
    }

    set((state) => {
      const updated = state.cashiers.map((c) =>
        c.id === cashierId ? { ...c, avatar_url: undefined } : c
      );
      const newActive = state.activeCashier?.id === cashierId
        ? { ...state.activeCashier, avatar_url: undefined }
        : state.activeCashier;
      return { cashiers: updated, activeCashier: newActive };
    });

    // 2. Hapus dari database Supabase Storage
    try {
      if (Capacitor.isNativePlatform()) {
        const secretKey = getSupabaseSecretKey();
        await fetch(`${SUPABASE_BASE_URL}/storage/v1/object/avatars`, {
          method: 'DELETE',
          headers: {
            apikey: secretKey,
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefixes: [`${cashierId}.jpg`] }),
        });
      } else {
        await supabase.storage.from('avatars').remove([`${cashierId}.jpg`]);
      }
      // Broadcast hapus avatar ke semua device
      await broadcastCashierAvatarChanged(cashierId, '');
    } catch (err) {
      logError('cashierStore:deleteCashierAvatar_err', err);
    }
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
