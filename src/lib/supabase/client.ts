import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types.ts';

const DEFAULT_SUPABASE_URL = 'https://fiaetjtqhvdewqffliai.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_JQwXFsdu3S-BosZugbD4pw_ei_cNBdP';

// Mendukung konfigurasi variabel lingkungan dengan awalan SUPABASE_ maupun VITE_ (kompatibel penuh dengan Supabase & Vercel)
const env = (typeof import.meta !== 'undefined' ? import.meta.env : undefined) as Record<string, string | undefined> | undefined;

const supabaseUrl =
  env?.SUPABASE_URL ||
  env?.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  env?.SUPABASE_ANON_KEY ||
  env?.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;

const isPlaceholderKey =
  !supabaseAnonKey ||
  supabaseAnonKey === 'your_supabase_anon_key_here' ||
  supabaseAnonKey === 'salin_kunci_anon_ke_sini';

/**
 * Klien Supabase bertipe ketat.
 * Hanya menggunakan kunci anon publik. Kunci service_role DILARANG di kode klien.
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
