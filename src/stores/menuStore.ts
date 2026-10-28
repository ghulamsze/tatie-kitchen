import { create } from 'zustand';
import { MenuItem, MenuGroup } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured, syncMenuItemAvailabilityToSupabase, MENU_NAME_ALIASES } from '../lib/supabase/client.ts';
import { logError, logWarning } from '../lib/logger/logger.ts';
import { broadcastMenuAvailability, broadcastMenuChanged } from '../lib/supabase/realtime.ts';
import { TATIE_SHOP_ID } from './shopStore.ts';

const isUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

const getStableHue = (name: string): number => {
  let hash = 0;
  const str = name || '';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
};

const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export type CanonicalMenuCategory = 'makanan' | 'mie' | 'minuman' | 'roti' | 'kue' | 'snack';

/**
 * Resolver kategori kanonikal tunggal untuk seluruh aplikasi (Tablet, Phone, Menu Lengkap)
 * Aturan: hanya kategori makanan, mie, minuman, roti, kue dan snack. Pizza masuk di makanan.
 */
export function getItemCategory(
  item: MenuItem,
  groups: MenuGroup[] = []
): CanonicalMenuCategory {
  const normName = (item.name || '').trim().toLowerCase();
  const gid = (item.group_id || '').toLowerCase();

  const grp = groups.find((g) => g.id === item.group_id);
  const grpCat = grp ? (grp.category || '').toLowerCase().trim() : '';
  const grpName = grp ? (grp.name || '').toLowerCase().trim() : '';

  // 1. Pizza masuk ke makanan sesuai instruksi
  if (
    normName.includes('pizza') ||
    grpCat === 'pizza' ||
    grpName.includes('pizza') ||
    gid.includes('pizza')
  ) {
    return 'makanan';
  }

  // 2. Kue
  if (
    grpCat === 'kue' ||
    gid.includes('kue') ||
    grpName.includes('kue') ||
    grpName.includes('donat') ||
    grpName.includes('cake') ||
    grpName.includes('brownies') ||
    normName.includes('donat') ||
    normName.includes('brownies') ||
    normName.includes('bolu') ||
    normName.includes('pie') ||
    normName.includes('cake') ||
    normName.includes('tart')
  ) {
    return 'kue';
  }

  // 3. Roti
  if (
    grpCat === 'roti' ||
    gid.includes('roti') ||
    grpName.includes('roti') ||
    grpName.includes('pastry') ||
    normName.includes('roti') ||
    normName.includes('toast')
  ) {
    return 'roti';
  }

  // 4. Minuman
  if (
    grpCat === 'minuman' ||
    gid.includes('minuman') ||
    grpName.includes('kopi') ||
    grpName.includes('teh') ||
    grpName.includes('es ') ||
    grpName.includes('cokelat') ||
    normName.includes('kopi') ||
    normName.includes('coffee') ||
    normName.includes('latte') ||
    normName.includes('teh') ||
    normName.includes('tea') ||
    normName.includes('cokelat') ||
    normName.includes('chocolate') ||
    normName.includes('milo') ||
    normName.includes('cadbur') ||
    normName.includes('squash') ||
    normName.includes('jus') ||
    normName.includes('juice') ||
    normName.includes('jeruk') ||
    normName.includes('americano') ||
    normName.includes('cappuccino') ||
    normName.includes('mochachino') ||
    normName.includes('butterscotch') ||
    normName.includes('vanilla') ||
    normName.includes('vanila') ||
    normName.includes('red velvet') ||
    normName.includes('matcha') ||
    normName.includes('green tea') ||
    normName.includes('nestum') ||
    normName.includes('hazelnut') ||
    normName.includes('caramel') ||
    normName.includes('air mineral') ||
    normName.includes('susu') ||
    normName.includes('extrajoss') ||
    normName.includes('curacao')
  ) {
    return 'minuman';
  }

  // 5. Mie
  if (
    grpCat === 'mie' ||
    gid.includes('mie') ||
    grpName.includes('mie') ||
    normName.includes('mie') ||
    normName.includes('indomie') ||
    normName.includes('bihun') ||
    normName.includes('kwetiau') ||
    normName.includes('pasta') ||
    normName.includes('spaghetti')
  ) {
    return 'mie';
  }

  // 6. Snack
  if (
    grpCat === 'snack' ||
    gid.includes('snack') ||
    grpName.includes('camilan') ||
    grpName.includes('burger') ||
    normName.includes('risol') ||
    normName.includes('nugget') ||
    normName.includes('lekor') ||
    normName.includes('sosis') ||
    normName.includes('platter') ||
    normName.includes('kentang') ||
    normName.includes('burger') ||
    normName.includes('kebab') ||
    normName.includes('pisang') ||
    normName.includes('camilan')
  ) {
    return 'snack';
  }

  return 'makanan';
}

// Data menu awal lengkap dari MG, TR, HB HTML dengan URL foto makanan asli internet
export const SEED_MENU_ITEMS: (MenuItem & { hue: number })[] = [
  // --- MIE ---
  {
    id: 'm-01',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Mie Goreng Komplit',
    price_idr: 40000,
    available: true,
    photo_path: '/assets/images/mie/mie_goreng_komplit.webp',
    sort: 1,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-mie-kuah',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Mie Titi',
    price_idr: 30000,
    available: true,
    photo_path: '/assets/images/mie/mie_titi.webp',
    sort: 2,
    active: true,
    created_at: '',
    hue: 35,
  },
  {
    id: 'm-mie-telur',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Mie Goreng Telur',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/mie/mie_goreng_telur.webp',
    sort: 3,
    active: true,
    created_at: '',
    hue: 30,
  },
  {
    id: 'm-mie-ayam',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Mie Goreng Ayam',
    price_idr: 35000,
    available: true,
    photo_path: '/assets/images/mie/mie_goreng_ayam.webp',
    sort: 4,
    active: true,
    created_at: '',
    hue: 32,
  },
  {
    id: 'm-13',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Mie Tek Tek',
    price_idr: 30000,
    available: true,
    photo_path: '/assets/images/mie/mie_tek_tek.webp',
    sort: 5,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-indomie',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Indomie Goreng',
    price_idr: 20000,
    available: true,
    photo_path: '/assets/images/mie/indomie_goreng.webp',
    sort: 7,
    active: true,
    created_at: '',
    hue: 34,
  },

  // --- MAKANAN: NASI GORENG ---
  {
    id: 'm-07',
    shop_id: 'shop-001',
    group_id: 'g-makanan-1',
    name: 'Nasi Goreng Telur',
    price_idr: 20000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasgor_telur.webp',
    sort: 8,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-nasgor-suwir',
    shop_id: 'shop-001',
    group_id: 'g-makanan-1',
    name: 'Nasi Goreng Telur Ayam Suwir',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasgor_telur_ayam_suwir.webp',
    sort: 9,
    active: true,
    created_at: '',
    hue: 26,
  },
  {
    id: 'm-nasgor-ayam',
    shop_id: 'shop-001',
    group_id: 'g-makanan-1',
    name: 'Nasi Goreng Ayam',
    price_idr: 33000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasgor_ayam.webp',
    sort: 10,
    active: true,
    created_at: '',
    hue: 25,
  },
  {
    id: 'm-nasgor-komplit',
    shop_id: 'shop-001',
    group_id: 'g-makanan-1',
    name: 'Nasi Goreng Ayam Komplit',
    price_idr: 38000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasgor_ayam_komplit.webp',
    sort: 11,
    active: true,
    created_at: '',
    hue: 27,
  },
  {
    id: 'm-nasgor-mercon-telur',
    shop_id: 'shop-001',
    group_id: 'g-makanan-1',
    name: 'Nasi Goreng Mercon Telur',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasgor_mercon_telur.webp',
    sort: 12,
    active: true,
    created_at: '',
    hue: 12,
  },
  {
    id: 'm-nasgor-mercon-ayam',
    shop_id: 'shop-001',
    group_id: 'g-makanan-1',
    name: 'Nasi Goreng Mercon Ayam',
    price_idr: 35000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasi_goreng_mercon_ayam.webp',
    sort: 13,
    active: true,
    created_at: '',
    hue: 10,
  },
  {
    id: 'm-nasgor-mercon-komplit',
    shop_id: 'shop-001',
    group_id: 'g-makanan-1',
    name: 'Nasi Goreng Mercon Komplit',
    price_idr: 40000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasgor_mercon_komplit.webp',
    sort: 14,
    active: true,
    created_at: '',
    hue: 14,
  },

  // --- MAKANAN: NASI AYAM ---
  {
    id: 'm-09',
    shop_id: 'shop-001',
    group_id: 'g-makanan-2',
    name: 'Nasi Ayam Geprek',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasi_ayam_geprek.webp',
    sort: 15,
    active: true,
    created_at: '',
    hue: 30,
  },
  {
    id: 'm-ayam-crispy',
    shop_id: 'shop-001',
    group_id: 'g-makanan-2',
    name: 'Nasi Ayam Crispy',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasi_ayam_crispy.webp',
    sort: 16,
    active: true,
    created_at: '',
    hue: 35,
  },
  {
    id: 'm-ayam-lava',
    shop_id: 'shop-001',
    group_id: 'g-makanan-2',
    name: 'Nasi Ayam Crispy Lava',
    price_idr: 30000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasi_ayam_crispy_lava.webp',
    sort: 17,
    active: true,
    created_at: '',
    hue: 15,
  },
  {
    id: 'm-ayam-lalap',
    shop_id: 'shop-001',
    group_id: 'g-makanan-2',
    name: 'Nasi Ayam Lalap',
    price_idr: 35000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasi_ayam_lalap.webp',
    sort: 18,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-08',
    shop_id: 'shop-001',
    group_id: 'g-makanan-2',
    name: 'Nasi Ayam Penyet',
    price_idr: 35000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasi_ayam_penyet.webp',
    sort: 19,
    active: true,
    created_at: '',
    hue: 32,
  },
  {
    id: 'm-ayam-bakar',
    shop_id: 'shop-001',
    group_id: 'g-makanan-2',
    name: 'Nasi Ayam Bakar',
    price_idr: 35000,
    available: true,
    photo_path: '/assets/images/makanan_berat/nasi_ayam_bakar.webp',
    sort: 20,
    active: true,
    created_at: '',
    hue: 20,
  },

  // --- MAKANAN: BERKUAH ---
  {
    id: 'm-soto-ayam',
    shop_id: 'shop-001',
    group_id: 'g-makanan-2',
    name: 'Soto Ayam',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/makanan_berat/soto_ayam.webp',
    sort: 24,
    active: true,
    created_at: '',
    hue: 45,
  },
  {
    id: 'm-14',
    shop_id: 'shop-001',
    group_id: 'g-makanan-2',
    name: 'Coto Makassar',
    price_idr: 30000,
    available: true,
    photo_path: '/assets/images/makanan_berat/coto_makassar.webp',
    sort: 25,
    active: true,
    created_at: '',
    hue: 15,
  },

  // --- SNACK: CAMILAN ---
  {
    id: 'm-04',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Nugget',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/snack/nugget.webp',
    sort: 26,
    active: true,
    created_at: '',
    hue: 42,
  },
  {
    id: 'm-lekor',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Lekor',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/snack/lekor.webp',
    sort: 27,
    active: true,
    created_at: '',
    hue: 38,
  },
  {
    id: 'm-sosis',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Sosis Goreng',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/snack/sosis_goreng.webp',
    sort: 28,
    active: true,
    created_at: '',
    hue: 18,
  },
  {
    id: 'm-platter',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Platter',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/snack/platter.webp',
    sort: 29,
    active: true,
    created_at: '',
    hue: 35,
  },
  {
    id: 'm-12',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Pisang Nugget Cokelat',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/snack/pisang_nugget_coklat.webp',
    sort: 30,
    active: true,
    created_at: '',
    hue: 24,
  },
  {
    id: 'm-pisang-keju',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Pisang Nugget Keju',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/snack/pisang_nugget_keju.webp',
    sort: 31,
    active: true,
    created_at: '',
    hue: 48,
  },
  {
    id: 'm-pisang-cokelat-keju',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Pisang Nugget Cokelat Keju',
    price_idr: 18000,
    available: true,
    photo_path: '/assets/images/snack/pisang_nugget_coklat_&_keju.webp',
    sort: 32,
    active: true,
    created_at: '',
    hue: 32,
  },

  // --- SNACK: BURGER DAN ROTI ---
  {
    id: 'm-10',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Burger Telur',
    price_idr: 20000,
    available: true,
    photo_path: '/assets/images/snack/burger_telur.webp',
    sort: 33,
    active: true,
    created_at: '',
    hue: 20,
  },
  {
    id: 'm-02',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Burger Daging',
    price_idr: 20000,
    available: true,
    photo_path: '/assets/images/snack/burger_daging.webp',
    sort: 34,
    active: true,
    created_at: '',
    hue: 18,
  },
  {
    id: 'm-burger-komplit',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Burger Komplit',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/snack/burger_komplit.webp',
    sort: 35,
    active: true,
    created_at: '',
    hue: 22,
  },
  {
    id: 'm-roti-bakar',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Bakar',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/snack/roti_bakar.webp',
    sort: 36,
    active: true,
    created_at: '',
    hue: 26,
  },
  {
    id: 'm-11',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti John',
    price_idr: 30000,
    available: true,
    photo_path: '/assets/images/snack/roti_john.webp',
    sort: 37,
    active: true,
    created_at: '',
    hue: 22,
  },
  {
    id: 'm-03',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Kebab',
    price_idr: 30000,
    available: true,
    photo_path: '/assets/images/snack/kebab.webp',
    sort: 38,
    active: true,
    created_at: '',
    hue: 35,
  },

  // --- KELOMPOK ROTI & KUE ---
  {
    id: 'm-roti-coklat',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Coklat',
    price_idr: 8000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/roti_coklat_1.webp',
    sort: 39,
    active: true,
    created_at: '',
    hue: 24,
  },
  {
    id: 'm-roti-keju',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Keju',
    price_idr: 8000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/roti_keju.webp',
    sort: 40,
    active: true,
    created_at: '',
    hue: 45,
  },
  {
    id: 'm-roti-meses',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Meses',
    price_idr: 8000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/roti_cream_meses.webp',
    sort: 41,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-roti-cream-keju',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Cream Keju',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/roti_keju.webp',
    sort: 42,
    active: true,
    created_at: '',
    hue: 48,
  },
  {
    id: 'm-roti-cream-meses',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Cream Meses',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/roti_cream_meses.webp',
    sort: 43,
    active: true,
    created_at: '',
    hue: 30,
  },
  {
    id: 'm-roti-bund-coklat',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Bund Isi Coklat',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/roti_bund_isi_coklat.webp',
    sort: 43,
    active: true,
    created_at: '',
    hue: 32,
  },
  {
    id: 'm-roti-abon',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Abon',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/roti_abon.webp',
    sort: 44,
    active: true,
    created_at: '',
    hue: 35,
  },
  {
    id: 'm-roti-o',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: "Roti'O",
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/roti_o.webp',
    sort: 45,
    active: true,
    created_at: '',
    hue: 32,
  },
  {
    id: 'm-roti-sosis',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Sosis',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/roti_sosis.webp',
    sort: 46,
    active: true,
    created_at: '',
    hue: 15,
  },
  {
    id: 'm-roti-pisang-coklat',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Pisang Coklat',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/pisang_coklat.webp',
    sort: 47,
    active: true,
    created_at: '',
    hue: 25,
  },
  {
    id: 'm-roti-pintal-sosis',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Pintal Sosis',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/pintal_sosis.webp',
    sort: 48,
    active: true,
    created_at: '',
    hue: 18,
  },
  {
    id: 'm-roti-sobek',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Sobek',
    price_idr: 30000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/roti_sobek.webp',
    sort: 49,
    active: true,
    created_at: '',
    hue: 38,
  },
  {
    id: 'm-pizza',
    shop_id: 'shop-001',
    group_id: 'g-pizza',
    name: 'Pizza',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/pizza_big.webp',
    sort: 50,
    active: true,
    created_at: '',
    hue: 10,
    variants: [
      { name: 'Mini', price_idr: 10000 },
      { name: 'Big', price_idr: 100000 },
    ],
  },
  // --- MENU DENGAN VARIAN (SATU KARTU DENGAN MODAL PILIHAN) ---
  {
    id: 'm-donat',
    shop_id: 'shop-001',
    group_id: 'g-kue',
    name: 'Donat',
    price_idr: 18000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/donat_all_varian.webp',
    sort: 51,
    active: true,
    created_at: '',
    hue: 40,
    variants: [
      { name: 'Isi 3', price_idr: 18000 },
      { name: 'Isi 6', price_idr: 35000 },
    ],
  },
  {
    id: 'm-brownies',
    shop_id: 'shop-001',
    group_id: 'g-kue',
    name: 'Brownies',
    price_idr: 50000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/brownies.webp',
    sort: 52,
    active: true,
    created_at: '',
    hue: 20,
    variants: [
      { name: 'Ukuran M', price_idr: 50000 },
      { name: 'Ukuran L', price_idr: 90000 },
    ],
  },
  {
    id: 'm-bolu',
    shop_id: 'shop-001',
    group_id: 'g-kue',
    name: 'Bolu',
    price_idr: 50000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/bolu_pandan.webp',
    sort: 53,
    active: true,
    created_at: '',
    hue: 50,
    variants: [
      { name: 'Vanilla - M', price_idr: 50000 },
      { name: 'Vanilla - L', price_idr: 90000 },
      { name: 'Pandan - M', price_idr: 50000 },
      { name: 'Pandan - L', price_idr: 90000 },
    ],
  },
  {
    id: 'm-cake-ultah',
    shop_id: 'shop-001',
    group_id: 'g-kue',
    name: 'Kue Ulang Tahun',
    price_idr: 100000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/kue_ultah_all_varian.webp',
    sort: 54,
    active: true,
    created_at: '',
    hue: 330,
    variants: [
      { name: '100k', price_idr: 100000 },
      { name: '150k', price_idr: 150000 },
      { name: '200k', price_idr: 200000 },
      { name: '250k', price_idr: 250000 },
      { name: '350k', price_idr: 350000 },
      { name: '500k', price_idr: 500000 },
      { name: '750k', price_idr: 750000 },
    ],
  },
  {
    id: 'm-risol',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Risol',
    price_idr: 4000,
    available: true,
    photo_path: null,
    sort: 55,
    active: true,
    created_at: '',
    hue: 35,
    variants: [
      { name: 'Mayonise', price_idr: 4000 },
      { name: 'Ayam Suwir', price_idr: 4000 },
    ],
  },
  {
    id: 'm-pie-susu',
    shop_id: 'shop-001',
    group_id: 'g-kue',
    name: 'Pie Susu',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/pie_susu.webp',
    sort: 56,
    active: true,
    created_at: '',
    hue: 45,
  },
  {
    id: 'm-pie-brownies',
    shop_id: 'shop-001',
    group_id: 'g-kue',
    name: 'Pie Brownies',
    price_idr: 5000,
    available: true,
    photo_path: '/assets/images/roti_dan_kue/pie_brownies.webp',
    sort: 57,
    active: true,
    created_at: '',
    hue: 24,
  },

  // --- MINUMAN: KOPI PANAS & ES KOPI ---
  {
    id: 'm-kopi-hitam',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Kopi Hitam',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/minuman/minuman_panas/kopi_hitam.webp',
    sort: 39,
    active: true,
    created_at: '',
    hue: 15,
  },
  {
    id: 'm-05',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Kopi Susu',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/minuman_panas/kopi_susu.webp',
    sort: 40,
    active: true,
    created_at: '',
    hue: 25,
  },
  {
    id: 'm-americano',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Americano',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/americano.webp',
    sort: 41,
    active: true,
    created_at: '',
    hue: 18,
  },
  {
    id: 'm-15',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Cappuccino',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/cappucino.webp',
    sort: 42,
    active: true,
    created_at: '',
    hue: 26,
  },
  {
    id: 'm-mochachino',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Mochachino',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/mochacino.webp',
    sort: 43,
    active: true,
    created_at: '',
    hue: 20,
  },
  {
    id: 'm-latte',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Latte Coffee',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/latte_coffee.webp',
    sort: 44,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-gula-aren',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Gula Aren Coffee',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/gula_aren_coffee.webp',
    sort: 45,
    active: true,
    created_at: '',
    hue: 22,
  },
  {
    id: 'm-butterscote',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Butterscotch Latte Coffee',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/butterscotch_latte.webp',
    sort: 46,
    active: true,
    created_at: '',
    hue: 35,
  },

  // --- MINUMAN: ES KOPI RASA DAN CREAM ---
  {
    id: 'm-tiramisu',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Tiramisu Coffee',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/tiramisu_coffee.webp',
    sort: 47,
    active: true,
    created_at: '',
    hue: 24,
  },
  {
    id: 'm-hazelnut',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Hazelnut Coffee',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/hazelnut_coffee.webp',
    sort: 48,
    active: true,
    created_at: '',
    hue: 27,
  },
  {
    id: 'm-vanila-coffee',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Vanilla Coffee',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/vanilla_coffee.webp',
    sort: 49,
    active: true,
    created_at: '',
    hue: 38,
  },
  {
    id: 'm-strawberry-coffee',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Strawberry Coffee',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/strawberry_coffee.webp',
    sort: 50,
    active: true,
    created_at: '',
    hue: 350,
  },
  {
    id: 'm-gula-aren-cream',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Gula Aren Coffee Cream',
    price_idr: 20000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/gula_aren_cream.webp',
    sort: 51,
    active: true,
    created_at: '',
    hue: 24,
  },
  {
    id: 'm-panda-cream',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Pandan Coffee Cream',
    price_idr: 20000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/pandan_coffee.webp',
    sort: 52,
    active: true,
    created_at: '',
    hue: 140,
  },
  {
    id: 'm-melon-cream',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Melon Coffee Cream',
    price_idr: 20000,
    available: true,
    photo_path: '/assets/images/minuman/ice_coffee/melon_coffee_cream.webp',
    sort: 53,
    active: true,
    created_at: '',
    hue: 100,
  },

  // --- MINUMAN: TEH DAN SEGAR ---
  {
    id: 'm-06',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Es Teh',
    price_idr: 5000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/es_teh.webp',
    sort: 54,
    active: true,
    created_at: '',
    hue: 38,
  },
  {
    id: 'm-teh-panas',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Teh',
    price_idr: 5000,
    available: true,
    photo_path: '/assets/images/minuman/minuman_panas/teh.webp',
    sort: 55,
    active: true,
    created_at: '',
    hue: 36,
  },
  {
    id: 'm-teh-susu',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Teh Susu',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/minuman_panas/teh_susu.webp',
    sort: 56,
    active: true,
    created_at: '',
    hue: 32,
  },
  {
    id: 'm-jeruk',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Jeruk',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/es_jeruk.webp',
    sort: 57,
    active: true,
    created_at: '',
    hue: 40,
  },
  {
    id: 'm-lemon-tea',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Lemon Tea',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/lemon_tea.webp',
    sort: 58,
    active: true,
    created_at: '',
    hue: 48,
  },
  {
    id: 'm-teh-tarik',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Teh Tarik',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/teh_tarik.webp',
    sort: 59,
    active: true,
    created_at: '',
    hue: 30,
  },
  {
    id: 'm-thai-tea',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Thai Tea',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/thai_tea.webp',
    sort: 60,
    active: true,
    created_at: '',
    hue: 24,
  },
  {
    id: 'm-susu-pandan',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Susu Pandan',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/susu_pandan.webp',
    sort: 61,
    active: true,
    created_at: '',
    hue: 130,
  },

  // --- MINUMAN: COKELAT DAN SUSU ---
  {
    id: 'm-cokelat-ori',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Cokelat Ori',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/coklat_ori.webp',
    sort: 62,
    active: true,
    created_at: '',
    hue: 18,
  },
  {
    id: 'm-cokelat-almond',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Cokelat Almond',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/almond_coklat.webp',
    sort: 63,
    active: true,
    created_at: '',
    hue: 22,
  },
  {
    id: 'm-16',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Milo',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/milo.webp',
    sort: 64,
    active: true,
    created_at: '',
    hue: 20,
  },
  {
    id: 'm-cadburry',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Cadbury',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/cadbury.webp',
    sort: 65,
    active: true,
    created_at: '',
    hue: 260,
  },
  {
    id: 'm-brown-sugar',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Brown Sugar',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/brown_sugar.webp',
    sort: 66,
    active: true,
    created_at: '',
    hue: 25,
  },
  {
    id: 'm-extrajoss',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Extra Joss Susu',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/extra_joss_susu.webp',
    sort: 67,
    active: true,
    created_at: '',
    hue: 52,
  },

  // --- MINUMAN: RASA LAIN & SPESIAL ---
  {
    id: 'm-taro',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Taro',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/taro.webp',
    sort: 68,
    active: true,
    created_at: '',
    hue: 275,
  },
  {
    id: 'm-strawberry',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Strawberry',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/strawberry.webp',
    sort: 69,
    active: true,
    created_at: '',
    hue: 345,
  },
  {
    id: 'm-mangga-milky',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Mangga Milky',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/mangga_milky.webp',
    sort: 70,
    active: true,
    created_at: '',
    hue: 42,
  },
  {
    id: 'm-red-velvet',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Red Velvet',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/red_velvet.webp',
    sort: 71,
    active: true,
    created_at: '',
    hue: 355,
  },
  {
    id: 'm-vanilla',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Vanilla',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/ice_non_coffee/vanilla.webp',
    sort: 72,
    active: true,
    created_at: '',
    hue: 45,
  },
  {
    id: 'm-green-tea',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Green Tea',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/minuman_special/green_tea.webp',
    sort: 73,
    active: true,
    created_at: '',
    hue: 135,
  },
  {
    id: 'm-matcha',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Matcha',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/minuman_special/matcha.webp',
    sort: 74,
    active: true,
    created_at: '',
    hue: 125,
  },
  {
    id: 'm-nestum',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Nestum',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/minuman_panas/kopi_susu.webp',
    sort: 75,
    active: true,
    created_at: '',
    hue: 35,
  },
  {
    id: 'm-mangga-squash',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Mangga Squash',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/minuman_special/mangga_squash.webp',
    sort: 76,
    active: true,
    created_at: '',
    hue: 42,
  },
  {
    id: 'm-blue-curacao',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Blue Curacao Squash',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/minuman_special/blue_curacao.webp',
    sort: 77,
    active: true,
    created_at: '',
    hue: 205,
  },
  {
    id: 'm-strawberry-squash',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Strawberry Squash',
    price_idr: 15000,
    available: true,
    photo_path: '/assets/images/minuman/minuman_special/strawberry_squash.webp',
    sort: 78,
    active: true,
    created_at: '',
    hue: 350,
  },
];

export const SEED_MENU_GROUPS: MenuGroup[] = [
  { id: 'g-makanan', shop_id: 'shop-001', category: 'makanan', name: 'Makanan', icon_key: 'Makanan', sort: 1 },
  { id: 'g-mie', shop_id: 'shop-001', category: 'mie', name: 'Mie', icon_key: 'Mie', sort: 2 },
  { id: 'g-minuman', shop_id: 'shop-001', category: 'minuman', name: 'Minuman', icon_key: 'Minuman', sort: 3 },
  { id: 'g-pizza', shop_id: 'shop-001', category: 'pizza', name: 'Pizza', icon_key: 'Pizza', sort: 4 },
  { id: 'g-roti', shop_id: 'shop-001', category: 'roti', name: 'Roti', icon_key: 'Roti', sort: 5 },
  { id: 'g-kue', shop_id: 'shop-001', category: 'kue', name: 'Kue', icon_key: 'Kue', sort: 6 },
  { id: 'g-snack', shop_id: 'shop-001', category: 'snack', name: 'Snack', icon_key: 'Snack', sort: 7 },
];

export const TOP_SELLERS_DEFAULT: [string, number][] = [
  ['Nasi Goreng Telur', 20000],
  ['Nasi Ayam Penyet', 35000],
  ['Nasi Ayam Geprek', 25000],
  ['Gula Aren Coffee', 15000],
  ['Cappuccino', 15000],
  ['Brown Sugar', 15000],
  ['Milo', 15000],
  ['Cokelat Ori', 15000],
  ['Teh Susu', 15000],
];

interface MenuState {
  items: (MenuItem & { hue?: number })[];
  groups: MenuGroup[];
  selectedCategory: string; // 'Semua' | 'Makanan' | 'Mie' | 'Snack' | 'Minuman'
  searchQuery: string;
  heldItem: MenuItem | null; // Untuk interaksi tahan kartu tandai habis
  toastMessage: string | null;

  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setHeldItem: (item: MenuItem | null) => void;
  setToastMessage: (msg: string | null) => void;
  toggleItemAvailability: (itemId: string, available: boolean) => Promise<void>;
  updateMenuItem: (updated: Partial<MenuItem> & { id: string }) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addMenuItem: (newItem: Omit<MenuItem, 'id' | 'shop_id' | 'active' | 'created_at'>) => Promise<MenuItem>;
  fetchMenu: (shopId?: string) => Promise<void>;
  subscribeToMenuChanges: () => () => void;
}

const loadSavedAvailability = (initialItems: (MenuItem & { hue: number })[]) => {
  let result = [...initialItems];
  try {
    const customRaw = localStorage.getItem('tk_custom_menu_items');
    if (customRaw) {
      const customMap = JSON.parse(customRaw);
      result = result.map((it) => (customMap[it.id] ? { ...it, ...customMap[it.id] } : it));
    }
    const deletedRaw = localStorage.getItem('tk_deleted_menu_ids');
    if (deletedRaw) {
      try {
        const deletedArr: string[] = JSON.parse(deletedRaw);
        const deletedSet = new Set(deletedArr);
        result = result.filter((it) => !deletedSet.has(it.id));
      } catch {}
    }
    const addedRaw = localStorage.getItem('tk_added_menu_items');
    if (addedRaw) {
      const addedList = JSON.parse(addedRaw);
      if (Array.isArray(addedList)) {
        result = [...addedList, ...result];
      }
    }
    const raw = localStorage.getItem('tk_item_availability');
    if (raw) {
      const map: Record<string, boolean | { available: boolean }> = JSON.parse(raw);
      return result.map((it) => {
        const normName = it.name.trim().toLowerCase();
        const alias = MENU_NAME_ALIASES[normName];
        let val: boolean | undefined;
        if (it.id in map) {
          const entry = map[it.id];
          val = typeof entry === 'object' && entry !== null ? entry.available : Boolean(entry);
        } else if (normName in map) {
          const entry = map[normName];
          val = typeof entry === 'object' && entry !== null ? entry.available : Boolean(entry);
        } else if (alias && alias.toLowerCase() in map) {
          const entry = map[alias.toLowerCase()];
          val = typeof entry === 'object' && entry !== null ? entry.available : Boolean(entry);
        }
        return val !== undefined ? { ...it, available: val } : it;
      });
    }
  } catch (err) {
    logError('menuStore:loadSavedAvailability', err);
  }
  return result.map((it) => {
    let gid = it.group_id;
    if (gid.startsWith('g-makanan')) gid = 'g-makanan';
    return gid !== it.group_id ? { ...it, group_id: gid } : it;
  });
};

async function resolveAvailableGroupId(
  requestedGroupId?: string,
  requestedCategory?: string
): Promise<string | null> {
  const fallbackMap: Record<string, string> = {
    makanan: '00000000-0000-0000-0000-000000000010',
    mie: '00000000-0000-0000-0000-000000000011',
    snack: '00000000-0000-0000-0000-000000000012',
    minuman: '00000000-0000-0000-0000-000000000013',
  };

  let rawCat = (requestedCategory || 'makanan').toLowerCase().trim();
  if (rawCat === 'pizza') rawCat = 'makanan';
  if (rawCat === 'roti' || rawCat === 'kue') rawCat = 'snack';

  const targetCategory = ['makanan', 'mie', 'minuman', 'snack'].includes(rawCat) ? rawCat : 'makanan';
  const defaultFallback = fallbackMap[targetCategory] || fallbackMap.makanan;

  try {
    // 1. Ambil hitungan item aktif per kelompok saat ini dari Supabase
    const { data: activeItems } = await (supabase.from('menu_items') as any)
      .select('group_id')
      .eq('active', true);

    const counts: Record<string, number> = {};
    if (Array.isArray(activeItems)) {
      activeItems.forEach((it: any) => {
        if (it?.group_id) {
          counts[it.group_id] = (counts[it.group_id] || 0) + 1;
        }
      });
    }

    // 2. Jika requestedGroupId adalah UUID valid dan kapasitasnya masih < 7, gunakan langsung
    if (requestedGroupId && isUuid(requestedGroupId)) {
      if ((counts[requestedGroupId] || 0) < 7) {
        return requestedGroupId;
      }
    }

    // 3. Ambil daftar semua kelompok menu dari Supabase
    const { data: allGroups } = await (supabase.from('menu_groups') as any)
      .select('id, category')
      .order('sort', { ascending: true });

    if (Array.isArray(allGroups) && allGroups.length > 0) {
      // Cari kelompok yang kategorinya sama dan memiliki item < 7
      const sameCategoryGroups = allGroups.filter(
        (g: any) => (g.category || '').toLowerCase() === targetCategory
      );
      const availableSameCat = sameCategoryGroups.find((g: any) => (counts[g.id] || 0) < 7);
      if (availableSameCat?.id) {
        return availableSameCat.id;
      }

      // Periksa apakah kelompok umum (00000000-0000-0000-0000-000000000010..13) masih ada slot < 7
      if ((counts[defaultFallback] || 0) < 7) {
        return defaultFallback;
      }

      // Jika kategori tersebut penuh, cari kelompok apa pun yang masih memiliki slot < 7
      const anyAvailable = allGroups.find((g: any) => (counts[g.id] || 0) < 7);
      if (anyAvailable?.id) {
        return anyAvailable.id;
      }
    }

    return null;
  } catch {
    return defaultFallback;
  }
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: loadSavedAvailability(SEED_MENU_ITEMS),
  groups: SEED_MENU_GROUPS,
  selectedCategory: 'Semua',
  searchQuery: '',
  heldItem: null,
  toastMessage: null,

  setCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setHeldItem: (item) => set({ heldItem: item }),
  setToastMessage: (msg) => set({ toastMessage: msg }),

  updateMenuItem: async (updated) => {
    set((state) => {
      const newItems = state.items.map((it) => (it.id === updated.id ? { ...it, ...updated } : it));
      try {
        const raw = localStorage.getItem('tk_custom_menu_items');
        const customMap: Record<string, Partial<MenuItem>> = raw ? JSON.parse(raw) : {};
        customMap[updated.id] = { ...(customMap[updated.id] || {}), ...updated };
        localStorage.setItem('tk_custom_menu_items', JSON.stringify(customMap));
      } catch {}
      return { items: newItems };
    });
    set({ toastMessage: `Menu ${updated.name || ''} berhasil diperbarui` });
    setTimeout(() => set({ toastMessage: null }), 2500);

    if (isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, any> = {
          name: updated.name,
          price_idr: updated.price_idr,
          available: updated.available,
          photo_path: updated.photo_path,
        };
        if (isUuid(updated.group_id)) {
          updatePayload.group_id = updated.group_id;
        } else if (updated.group_id) {
          const safeGroupId = await resolveAvailableGroupId(updated.group_id);
          if (safeGroupId && isUuid(safeGroupId)) {
            updatePayload.group_id = safeGroupId;
          }
        }

        if (isUuid(updated.id)) {
          await (supabase.from('menu_items') as any).update(updatePayload).eq('id', updated.id);
        } else if (updated.name) {
          await (supabase.from('menu_items') as any).update(updatePayload).ilike('name', updated.name.trim());
        }
        // Broadcast ke perangkat lain secara real-time
        broadcastMenuChanged('update', updated.id, updated.name).catch(() => {});
      } catch (err) {
        logError('menuStore:updateMenuItem', err);
      }
    }
  },

  deleteMenuItem: async (itemId: string) => {
    const itemToDelete = get().items.find((it) => it.id === itemId);
    const itemName = itemToDelete?.name?.trim();

    set((state) => {
      const newItems = state.items.filter((it) => it.id !== itemId);
      try {
        const deletedRaw = localStorage.getItem('tk_deleted_menu_ids');
        const deletedArr: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
        if (!deletedArr.includes(itemId)) {
          deletedArr.push(itemId);
          localStorage.setItem('tk_deleted_menu_ids', JSON.stringify(deletedArr));
        }

        const addedRaw = localStorage.getItem('tk_added_menu_items');
        if (addedRaw) {
          const addedList = JSON.parse(addedRaw);
          if (Array.isArray(addedList)) {
            const filtered = addedList.filter((it: any) => it.id !== itemId);
            localStorage.setItem('tk_added_menu_items', JSON.stringify(filtered));
          }
        }
      } catch (err) {
        logError('menuStore:deleteMenuItem:localStorage', err);
      }
      return { items: newItems };
    });

    if (isSupabaseConfigured()) {
      try {
        if (isUuid(itemId)) {
          await supabase.from('menu_items').delete().eq('id', itemId);
        } else if (itemName) {
          await supabase.from('menu_items').delete().ilike('name', itemName);
        }
        // Broadcast ke perangkat lain secara real-time
        broadcastMenuChanged('delete', itemId, itemName).catch(() => {});
      } catch (err) {
        logError('menuStore:deleteMenuItem:supabase', err);
      }
    }
  },

  addMenuItem: async (newItem) => {
    const newId = generateUuid();
    const created: MenuItem & { hue: number } = {
      id: newId,
      shop_id: TATIE_SHOP_ID,
      group_id: newItem.group_id || 'g-snack',
      name: newItem.name,
      price_idr: newItem.price_idr || 0,
      available: newItem.available ?? true,
      photo_path: newItem.photo_path || null,
      sort: 99,
      active: true,
      created_at: new Date().toISOString(),
      hue: getStableHue(newItem.name),
    };
    set((state) => {
      const newItems = [created, ...state.items];
      try {
        const raw = localStorage.getItem('tk_added_menu_items');
        const addedList: any[] = raw ? JSON.parse(raw) : [];
        addedList.unshift(created);
        localStorage.setItem('tk_added_menu_items', JSON.stringify(addedList));
      } catch {}
      return { items: newItems };
    });
    set({ toastMessage: `Menu ${created.name} berhasil ditambahkan` });
    setTimeout(() => set({ toastMessage: null }), 2500);

    if (isSupabaseConfigured()) {
      try {
        const safeGroupId = await resolveAvailableGroupId(
          created.group_id,
          (newItem as any).category
        );
        if (safeGroupId) {
          created.group_id = safeGroupId;
        }

        const payload: Record<string, any> = {
          shop_id: TATIE_SHOP_ID,
          name: created.name.trim(),
          price_idr: Math.max(0, Number(created.price_idr) || 0),
          available: Boolean(created.available),
          photo_path: created.photo_path || null,
          active: true,
          sort: Number(created.sort) || 99,
        };
        if (isUuid(created.id)) {
          payload.id = created.id;
        }
        if (isUuid(safeGroupId)) {
          payload.group_id = safeGroupId;
        }

        let { data: insData, error: insErr } = await (supabase.from('menu_items') as any)
          .insert(payload)
          .select();

        // Jika kena trigger batas 7 item atau error constraint group_id, coba insert dengan group_id: null
        if (insErr && payload.group_id) {
          logWarning('menuStore:addMenuItem:retryWithNullGroup', insErr.message || String(insErr));
          const retryPayload = { ...payload, group_id: null };
          const resRetry = await (supabase.from('menu_items') as any)
            .insert(retryPayload)
            .select();
          insData = resRetry.data;
          insErr = resRetry.error;
        }

        if (!insErr && Array.isArray(insData) && insData.length > 0 && insData[0]?.id) {
          const remoteId = insData[0].id;
          const assignedGroupId = insData[0].group_id || safeGroupId || created.group_id;
          if (remoteId && remoteId !== newId) {
            created.id = remoteId;
          }
          created.group_id = assignedGroupId;
          set((state) => {
            const updated = state.items.map((it) => (it.id === newId ? { ...it, id: created.id, group_id: assignedGroupId } : it));
            try {
              const raw = localStorage.getItem('tk_added_menu_items');
              const addedList: any[] = raw ? JSON.parse(raw) : [];
              const mapped = addedList.map((it) => (it.id === newId ? { ...it, id: created.id, group_id: assignedGroupId } : it));
              localStorage.setItem('tk_added_menu_items', JSON.stringify(mapped));
            } catch {}
            return { items: updated };
          });
          // Broadcast ke perangkat lain secara real-time
          broadcastMenuChanged('add', created.id, created.name).catch(() => {});
        } else if (insErr) {
          logWarning('menuStore:addMenuItem:insert', insErr.message || String(insErr));
        }
      } catch (err) {
        logError('menuStore:addMenuItem', err);
      }
    }
    return created;
  },

  toggleItemAvailability: async (itemId, available) => {
    const targetItem = get().items.find((i) => i.id === itemId);
    const normName = targetItem ? targetItem.name.trim().toLowerCase() : '';
    const alias = normName ? MENU_NAME_ALIASES[normName] : undefined;

    // 1. Update lokal state dulu secara instan dan simpan ke localStorage dengan dual key (ID & nama & alias)
    set((state) => {
      const updatedItems = state.items.map((i) => (i.id === itemId ? { ...i, available } : i));
      try {
        const raw = localStorage.getItem('tk_item_availability');
        const map = raw ? JSON.parse(raw) : {};
        map[itemId] = available;
        if (normName) {
          map[normName] = available;
        }
        if (alias) {
          map[alias.toLowerCase()] = available;
        }
        localStorage.setItem('tk_item_availability', JSON.stringify(map));
      } catch (err) {
        logError('menuStore:persistAvailability', err);
      }
      return {
        items: updatedItems,
        heldItem: null,
      };
    });

    const toast = targetItem
      ? available
        ? `${targetItem.name} tersedia lagi`
        : `${targetItem.name} ditandai habis`
      : 'Perubahan status disimpan';

    set({ toastMessage: toast });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 2500);

    // 2. Simpan ke database Supabase secara real-time via syncMenuItemAvailabilityToSupabase
    if (isSupabaseConfigured() && targetItem) {
      try {
        const syncResult = await syncMenuItemAvailabilityToSupabase(itemId, targetItem.name, available);
        if (syncResult.success && syncResult.updatedId) {
          try {
            const raw = localStorage.getItem('tk_item_availability');
            const map = raw ? JSON.parse(raw) : {};
            map[syncResult.updatedId] = available;
            localStorage.setItem('tk_item_availability', JSON.stringify(map));
          } catch {
            // ignore
          }
        }
        // 3. Broadcast ke seluruh perangkat lain secara real-time (< 100ms)
        const idToBroadcast = syncResult.success && syncResult.updatedId ? syncResult.updatedId : itemId;
        broadcastMenuAvailability(idToBroadcast, targetItem.name, available).catch(() => {});
      } catch (err) {
        logError('menuStore:syncMenuItemAvailabilityToSupabase', err);
      }
    }
  },

  fetchMenu: async (shopId) => {
    if (!isSupabaseConfigured()) return;
    try {
      // Muat daftar kelompok menu dari database Supabase
      try {
        const { data: grpData } = await (supabase.from('menu_groups') as any)
          .select('*')
          .order('sort', { ascending: true });
        if (Array.isArray(grpData) && grpData.length > 0) {
          set({ groups: grpData });
        }
      } catch (grpErr) {
        logWarning('menuStore:fetchGroups', String(grpErr));
      }

      let query = (supabase.from('menu_items') as any).select('*').eq('active', true);
      if (shopId) query = query.eq('shop_id', shopId);
      const { data, error } = await query;
      if (error) {
        logError('menuStore:fetchMenu_query', error);
        return;
      }

      if (Array.isArray(data) && data.length > 0) {
        const dbRows = data as any[];

        const dbItemsById = new Map<string, any>();
        const dbItemsByName = new Map<string, any>();

        dbRows.forEach((row: any) => {
          if (row.id) dbItemsById.set(row.id, row);
          if (row.name) dbItemsByName.set(row.name.trim().toLowerCase(), row);
        });

        const matchedDbRowIds = new Set<string>();

        // A. Sinkronkan item yang sudah ada di state lokal dengan data dari database
        const currentStateItems = get().items;
        const updatedExisting = currentStateItems.map((item) => {
          const normName = item.name.trim().toLowerCase();
          const alias = MENU_NAME_ALIASES[normName];
          const matchingRow =
            dbItemsById.get(item.id) ||
            dbItemsByName.get(normName) ||
            (alias ? dbItemsByName.get(alias.trim().toLowerCase()) : undefined);

          if (matchingRow) {
            matchedDbRowIds.add(matchingRow.id);
            return {
              ...item,
              id: matchingRow.id || item.id,
              name: matchingRow.name || item.name,
              price_idr: typeof matchingRow.price_idr === 'number' ? matchingRow.price_idr : item.price_idr,
              group_id: matchingRow.group_id || item.group_id,
              available: Boolean(matchingRow.available),
              photo_path:
                matchingRow.photo_path && !matchingRow.photo_path.startsWith('foto/')
                  ? matchingRow.photo_path
                  : item.photo_path || matchingRow.photo_path,
              sort: typeof matchingRow.sort === 'number' ? matchingRow.sort : item.sort,
              active: Boolean(matchingRow.active),
            };
          }

          return item;
        });

        // B. Masukkan baris baru dari Supabase yang belum ada di state lokal (misal ditambah dari Windows/Android lain)
        const newRemoteItems: (MenuItem & { hue: number })[] = [];
        dbRows.forEach((row: any) => {
          if (!matchedDbRowIds.has(row.id)) {
            newRemoteItems.push({
              id: row.id,
              shop_id: row.shop_id || TATIE_SHOP_ID,
              group_id: row.group_id || '00000000-0000-0000-0000-000000000010',
              name: row.name,
              price_idr: Number(row.price_idr) || 0,
              available: Boolean(row.available),
              photo_path: row.photo_path || null,
              sort: typeof row.sort === 'number' ? row.sort : 99,
              active: true,
              created_at: row.created_at || new Date().toISOString(),
              hue: getStableHue(row.name),
            });
          }
        });

        // Gabungkan: item baru diletakkan paling atas/depan agar langsung terlihat
        const combined = [...newRemoteItems, ...updatedExisting];

        // C. Filter keluar item yang telah dihapus di Supabase jika item tersebut memiliki UUID database
        const activeDbIdSet = new Set(dbRows.map((r: any) => r.id));
        const filteredFinalItems = combined.filter((it) => {
          if (isUuid(it.id)) {
            return activeDbIdSet.has(it.id);
          }
          return true;
        });

        // D. Simpan pembaruan status dan item tambahan ke localStorage agar tetap tersinkron offline
        try {
          const rawAvail = localStorage.getItem('tk_item_availability');
          const localMap = rawAvail ? JSON.parse(rawAvail) : {};
          dbRows.forEach((row: any) => {
            if (row.id) localMap[row.id] = Boolean(row.available);
            if (row.name) localMap[row.name.trim().toLowerCase()] = Boolean(row.available);
          });
          localStorage.setItem('tk_item_availability', JSON.stringify(localMap));

          if (newRemoteItems.length > 0) {
            const rawAdded = localStorage.getItem('tk_added_menu_items');
            const addedList: any[] = rawAdded ? JSON.parse(rawAdded) : [];
            const addedIdSet = new Set(addedList.map((x) => x.id));
            newRemoteItems.forEach((ri) => {
              if (!addedIdSet.has(ri.id)) {
                addedList.unshift(ri);
              }
            });
            localStorage.setItem('tk_added_menu_items', JSON.stringify(addedList));
          }
        } catch {
          // ignore
        }

        set({ items: filteredFinalItems });
      }
    } catch (err) {
      logError('menuStore:fetchMenu_exception', err);
    }
  },

  subscribeToMenuChanges: () => {
    logWarning(
      'menuStore:subscribeToMenuChanges',
      'Realtime belum tersambung - perubahan menu membutuhkan refresh manual.'
    );
    return () => {
      // noop unsubscribe
    };
  },
}));

