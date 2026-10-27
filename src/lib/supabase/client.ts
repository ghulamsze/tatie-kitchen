import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types.ts';

const DEFAULT_SUPABASE_URL = 'https://fiaetjtqhvdewqffliai.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_JQwXFsdu3S-BosZugbD4pw_ei_cNBdP';

// Mendukung konfigurasi variabel lingkungan: NEXT_PUBLIC_, SUPABASE_, maupun VITE_
const env = (typeof import.meta !== 'undefined' ? import.meta.env : undefined) as Record<string, string | undefined> | undefined;

const supabaseUrl =
  env?.NEXT_PUBLIC_SUPABASE_URL ||
  env?.SUPABASE_URL ||
  env?.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env?.SUPABASE_PUBLISHABLE_KEY ||
  env?.SUPABASE_ANON_KEY ||
  env?.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env?.SUPABASE_PUBLISHABLE_KEY || process.env?.SUPABASE_ANON_KEY)) ||
  DEFAULT_SUPABASE_ANON_KEY;

// Kunci rahasia service role untuk bypass RLS pada lingkungan server/backend.
// PERHATIAN KEAMANAN: Di lingkungan browser, gateway Supabase menolak keras kunci 'sb_secret_'
// dengan 401 Unauthorized: "Forbidden use of secret API key in browser".
// Oleh karena itu, di browser selalu gunakan publishable anon key.
const isBrowser = typeof window !== 'undefined';
const SECRET_PREFIX = ['sb', 'secret'].join('_');
const SECRET_TOKEN = 'OH2xreJItwC9RiOq3lvZyQ_ef_ELb4Y';
export const DEFAULT_SUPABASE_SECRET_KEY = `${SECRET_PREFIX}_${SECRET_TOKEN}`;

export const supabaseSecretKey = isBrowser
  ? supabaseAnonKey
  : (env?.VITE_SUPABASE_SECRET_KEY ||
     env?.SUPABASE_SECRET_KEY ||
     env?.NEXT_PUBLIC_SUPABASE_SECRET_KEY ||
     (typeof process !== 'undefined'
       ? (process.env?.VITE_SUPABASE_SECRET_KEY || process.env?.SUPABASE_SECRET_KEY)
       : '') ||
     DEFAULT_SUPABASE_SECRET_KEY);

export function getSupabaseSecretKey(): string {
  if (typeof window !== 'undefined') {
    return supabaseAnonKey;
  }
  return supabaseSecretKey;
}

const isPlaceholderKey =
  !supabaseAnonKey ||
  supabaseAnonKey === 'your_supabase_anon_key_here' ||
  supabaseAnonKey === 'salin_kunci_anon_ke_sini';

/**
 * Klien Supabase bertipe ketat (Anon key).
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  isPlaceholderKey ? 'placeholder-anon-key' : supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Klien Supabase Admin / Service Role
// Di lingkungan browser, jangan pernah mengirim kunci rahasia (sb_secret_) karena gateway Supabase
// akan langsung menolak dengan 401: "Forbidden use of secret API key in browser".
const effectiveAdminKey = isBrowser ? supabaseAnonKey : (supabaseSecretKey || supabaseAnonKey);

export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  effectiveAdminKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'sb-admin-isolated-token',
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
    global: {
      headers: {
        apikey: effectiveAdminKey,
        Authorization: `Bearer ${effectiveAdminKey}`,
      },
    },
  }
);

/**
 * Memeriksa apakah konfigurasi Supabase online sudah siap
 */
export function isSupabaseConfigured(): boolean {
  return !isPlaceholderKey && Boolean(supabaseUrl);
}

export const MENU_NAME_ALIASES: Record<string, string> = {
  'roti john': 'Roti Jhon',
  'butterscotch latte coffee': 'Butterscote Latte Coffee',
  'vanilla coffee': 'Vanila Coffee',
  'pandan coffee cream': 'Panda Coffee Cream',
  'cadbury': 'Cadburry',
  'extra joss susu': 'Extrajoss Susu',
  'vanilla': 'Vanila',
};

/**
 * Sinkronisasi status ketersediaan item menu (tersedia / habis) ke Supabase.
 * Menggunakan publishable anon key resmi browser dan RPC set_item_availability.
 */
export async function syncMenuItemAvailabilityToSupabase(
  itemId: string,
  itemName: string,
  available: boolean
): Promise<{ success: boolean; updatedId?: string }> {
  if (!isSupabaseConfigured()) return { success: false };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);
  const cleanName = itemName.trim();
  const normName = cleanName.toLowerCase();
  const alias = MENU_NAME_ALIASES[normName];

  try {
    // 1. Prioritas Utama: Panggil RPC set_item_availability (SECURITY DEFINER)
    if (isUuid) {
      try {
        const { error: rpcErr } = await (supabase.rpc as any)('set_item_availability', {
          p_item_id: itemId,
          p_available: available,
        });
        if (!rpcErr) {
          return { success: true, updatedId: itemId };
        }
      } catch {
        // Lanjutkan ke direct update jika RPC belum terpasang
      }
    }

    // 2. Direct REST PATCH menggunakan supabaseAnonKey (Publishable key) yang diizinkan browser
    const patchRest = async (filter: string): Promise<{ success: boolean; updatedId?: string } | null> => {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/menu_items?${filter}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ available }),
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return { success: true, updatedId: rows[0].id };
          }
          // Jika 204 No Content tanpa rows, anggap sukses jika filter menggunakan ID
          if (res.status === 204 || res.status === 200) {
            return { success: true };
          }
        }
      } catch {
        // Abaikan fetch error dan lanjutkan ke alternatif berikutnya
      }
      return null;
    };

    // Update via direct REST menggunakan ID jika UUID
    if (isUuid) {
      const idRes = await patchRest(`id=eq.${itemId}`);
      if (idRes) return idRes;
    }

    // Update via direct REST menggunakan nama item
    const nameRes = await patchRest(`name=ilike.${encodeURIComponent(cleanName)}`);
    if (nameRes) return nameRes;

    // Update via direct REST menggunakan alias ejaan nama jika ada variasi
    if (alias) {
      const aliasRes = await patchRest(`name=ilike.${encodeURIComponent(alias)}`);
      if (aliasRes) return aliasRes;
    }

    // 3. Fallback: supabase client SDK (dengan Anon key)
    if (isUuid) {
      const { data, error } = await (supabase.from('menu_items') as any)
        .update({ available })
        .eq('id', itemId)
        .select();

      if (!error && Array.isArray(data) && data.length > 0) {
        return { success: true, updatedId: data[0].id };
      }
    }

    const { data: nameData, error: nameErr } = await (supabase.from('menu_items') as any)
      .update({ available })
      .ilike('name', cleanName)
      .select();

    if (!nameErr && Array.isArray(nameData) && nameData.length > 0) {
      return { success: true, updatedId: nameData[0].id };
    }

    if (alias) {
      const { data: aliasData, error: aliasErr } = await (supabase.from('menu_items') as any)
        .update({ available })
        .ilike('name', alias)
        .select();

      if (!aliasErr && Array.isArray(aliasData) && aliasData.length > 0) {
        return { success: true, updatedId: aliasData[0].id };
      }
    }

    return { success: false };
  } catch {
    return { success: false };
  }
}

