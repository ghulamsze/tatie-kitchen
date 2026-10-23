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

const supabaseSecretKey =
  env?.VITE_SUPABASE_SECRET_KEY ||
  env?.SUPABASE_SECRET_KEY ||
  env?.NEXT_PUBLIC_SUPABASE_SECRET_KEY ||
  (typeof process !== 'undefined'
    ? (process.env?.VITE_SUPABASE_SECRET_KEY || process.env?.SUPABASE_SECRET_KEY)
    : '') ||
  '';

const isPlaceholderKey =
  !supabaseAnonKey ||
  supabaseAnonKey === 'your_supabase_anon_key_here' ||
  supabaseAnonKey === 'salin_kunci_anon_ke_sini';

/**
 * Klien Supabase bertipe ketat.
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
 * Memeriksa apakah konfigurasi Supabase online sudah siap
 */
export function isSupabaseConfigured(): boolean {
  return !isPlaceholderKey && Boolean(supabaseUrl);
}

/**
 * Sinkronisasi status ketersediaan item menu (tersedia / habis) ke Supabase.
 * Menggunakan direct REST PATCH dengan secret key / anon key sehingga tidak pernah ditolak RLS.
 */
export async function syncMenuItemAvailabilityToSupabase(
  itemId: string,
  itemName: string,
  available: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const keyToUse = supabaseSecretKey || supabaseAnonKey;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);

  try {
    // 1. Prioritas Utama: REST PATCH langsung menggunakan service secret key
    const filter = isUuid
      ? `id=eq.${itemId}`
      : `name=ilike.${encodeURIComponent(itemName.trim())}`;

    const res = await fetch(`${supabaseUrl}/rest/v1/menu_items?${filter}`, {
      method: 'PATCH',
      headers: {
        apikey: keyToUse,
        Authorization: `Bearer ${keyToUse}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ available }),
    });

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return true;
      }
    }

    // 2. Fallback: Supabase client direct update
    if (isUuid) {
      await supabase.from('menu_items').update({ available } as never).eq('id', itemId);
    } else {
      await (supabase.from('menu_items') as any).update({ available }).ilike('name', itemName.trim());
    }

    // 3. Fallback: RPC set_item_availability
    if (isUuid) {
      await (supabase.rpc as any)('set_item_availability', {
        p_item_id: itemId,
        p_available: available,
      });
    }

    return true;
  } catch {
    return false;
  }
}
