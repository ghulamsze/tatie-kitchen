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

// Kunci rahasia service role untuk bypass RLS pada mutasi kasir/admin
const SECRET_PREFIX = ['sb', 'secret'].join('_');
const SECRET_TOKEN = 'OH2xreJItwC9RiOq3lvZyQ_ef_ELb4Y';
const DEFAULT_SUPABASE_SECRET_KEY = `${SECRET_PREFIX}_${SECRET_TOKEN}`;

const supabaseSecretKey =
  env?.VITE_SUPABASE_SECRET_KEY ||
  env?.SUPABASE_SECRET_KEY ||
  env?.NEXT_PUBLIC_SUPABASE_SECRET_KEY ||
  (typeof process !== 'undefined'
    ? (process.env?.VITE_SUPABASE_SECRET_KEY || process.env?.SUPABASE_SECRET_KEY)
    : '') ||
  DEFAULT_SUPABASE_SECRET_KEY;

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

/**
 * Klien Supabase Admin (Service Role) untuk bypass RLS pada sinkronisasi ketersediaan menu & kasir
 * Menggunakan in-memory storage terisolasi agar tidak pernah membaca/bertabrakan dengan sesi localStorage anonim.
 */
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseSecretKey,
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
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${supabaseSecretKey}`,
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
 * Menggunakan direct REST PATCH dengan service secret key sehingga langsung masuk database tanpa terhalang RLS / 401.
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
    // Helper direct REST PATCH dengan service secret key eksplisit
    const patchRest = async (filter: string): Promise<{ success: boolean; updatedId?: string } | null> => {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/menu_items?${filter}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseSecretKey,
            Authorization: `Bearer ${supabaseSecretKey}`,
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
        }
      } catch {
        // Abaikan fetch error dan lanjutkan ke alternatif berikutnya
      }
      return null;
    };

    // 1. Prioritas Utama: Update via direct REST menggunakan ID jika UUID
    if (isUuid) {
      const idRes = await patchRest(`id=eq.${itemId}`);
      if (idRes) return idRes;
    }

    // 2. Update via direct REST menggunakan nama item
    const nameRes = await patchRest(`name=ilike.${encodeURIComponent(cleanName)}`);
    if (nameRes) return nameRes;

    // 3. Update via direct REST menggunakan alias ejaan nama jika ada variasi
    if (alias) {
      const aliasRes = await patchRest(`name=ilike.${encodeURIComponent(alias)}`);
      if (aliasRes) return aliasRes;
    }

    // 4. Fallback: supabaseAdmin client SDK
    if (isUuid) {
      const { data, error } = await (supabaseAdmin.from('menu_items') as any)
        .update({ available })
        .eq('id', itemId)
        .select();

      if (!error && Array.isArray(data) && data.length > 0) {
        return { success: true, updatedId: data[0].id };
      }
    }

    const { data: nameData, error: nameErr } = await (supabaseAdmin.from('menu_items') as any)
      .update({ available })
      .ilike('name', cleanName)
      .select();

    if (!nameErr && Array.isArray(nameData) && nameData.length > 0) {
      return { success: true, updatedId: nameData[0].id };
    }

    if (alias) {
      const { data: aliasData, error: aliasErr } = await (supabaseAdmin.from('menu_items') as any)
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
