import { create } from 'zustand';
import { MenuItem, MenuGroup } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured, syncMenuItemAvailabilityToSupabase, MENU_NAME_ALIASES } from '../lib/supabase/client.ts';
import { logError, logWarning } from '../lib/logger/logger.ts';
import { broadcastMenuAvailability } from '../lib/supabase/realtime.ts';

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
    photo_path: '/assets/images/mie/mie goreng komplit.webp',
    sort: 1,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-mie-kuah',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Mie Kuah',
    price_idr: 30000,
    available: true,
    photo_path: '/assets/images/mie/mie kuah.webp',
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
    photo_path: '/assets/images/mie/mie goreng telur.webp',
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
    photo_path: '/assets/images/mie/mie goreng ayam.webp',
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
    photo_path: '/assets/images/mie/mie tek tek.webp',
    sort: 5,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-mie-tradisional',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Mie Goreng Tradisional',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/mie/mie goreng tradisional.webp',
    sort: 6,
    active: true,
    created_at: '',
    hue: 26,
  },
  {
    id: 'm-indomie',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Indomie Goreng',
    price_idr: 20000,
    available: true,
    photo_path: '/assets/images/mie/indomie goreng.webp',
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
    photo_path: '/assets/images/makanan berat/nasgor telur.webp',
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
    photo_path: '/assets/images/makanan berat/nasgor telur ayam suwir.webp',
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
    photo_path: '/assets/images/makanan berat/nasgor ayam.webp',
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
    photo_path: '/assets/images/makanan berat/nasgor ayam komplit.webp',
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
    photo_path: '/assets/images/makanan berat/nasgor mercon telur.webp',
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
    photo_path: '/assets/images/makanan berat/nasi goreng mercon ayam.webp',
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
    photo_path: '/assets/images/makanan berat/nasgor mercon komplit.webp',
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
    photo_path: '/assets/images/makanan berat/nasi ayam geprek.webp',
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
    photo_path: '/assets/images/makanan berat/nasi ayam crispy.webp',
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
    photo_path: '/assets/images/makanan berat/nasi ayam crispy lava.webp',
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
    photo_path: '/assets/images/makanan berat/nasi ayam lalap.webp',
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
    photo_path: '/assets/images/makanan berat/nasi ayam penyet.webp',
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
    photo_path: '/assets/images/makanan berat/nasi ayam bakar.webp',
    sort: 20,
    active: true,
    created_at: '',
    hue: 20,
  },

  // --- MAKANAN: TRADISIONAL DAN BERKUAH ---
  {
    id: 'm-nasgor-trad-telur',
    shop_id: 'shop-001',
    group_id: 'g-makanan-3',
    name: 'Nasi Goreng Telur Tradisional',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/makanan berat/nasgor telur tradisional.webp',
    sort: 21,
    active: true,
    created_at: '',
    hue: 24,
  },
  {
    id: 'm-nasgor-trad-ayam',
    shop_id: 'shop-001',
    group_id: 'g-makanan-3',
    name: 'Nasi Goreng Ayam Tradisional',
    price_idr: 35000,
    available: true,
    photo_path: '/assets/images/makanan berat/nasgor ayam tradisional.webp',
    sort: 22,
    active: true,
    created_at: '',
    hue: 26,
  },
  {
    id: 'm-nasgor-trad-komplit',
    shop_id: 'shop-001',
    group_id: 'g-makanan-3',
    name: 'Nasi Goreng Tradisional Komplit',
    price_idr: 40000,
    available: true,
    photo_path: '/assets/images/makanan berat/nasgor tradisional komplit.webp',
    sort: 23,
    active: true,
    created_at: '',
    hue: 29,
  },
  {
    id: 'm-soto-ayam',
    shop_id: 'shop-001',
    group_id: 'g-makanan-3',
    name: 'Soto Ayam',
    price_idr: 25000,
    available: true,
    photo_path: '/assets/images/makanan berat/soto ayam.webp',
    sort: 24,
    active: true,
    created_at: '',
    hue: 45,
  },
  {
    id: 'm-14',
    shop_id: 'shop-001',
    group_id: 'g-makanan-3',
    name: 'Coto Makassar',
    price_idr: 30000,
    available: true,
    photo_path: '/assets/images/makanan berat/coto makassar.webp',
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
    photo_path: '/assets/images/snack/sosis goreng.webp',
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
    photo_path: '/assets/images/snack/pisang nugget coklat.webp',
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
    photo_path: '/assets/images/snack/pisang nugget keju.webp',
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
    photo_path: '/assets/images/snack/pisang nugget coklat & keju.webp',
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
    photo_path: '/assets/images/snack/burger telur.webp',
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
    photo_path: '/assets/images/snack/burger daging.webp',
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
    photo_path: '/assets/images/snack/burger komplit.webp',
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
    photo_path: '/assets/images/snack/roti bakar.webp',
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
    photo_path: '/assets/images/snack/roti john.webp',
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
    photo_path: null,
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
    photo_path: null,
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
    photo_path: null,
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
    photo_path: null,
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
    photo_path: null,
    sort: 43,
    active: true,
    created_at: '',
    hue: 30,
  },
  {
    id: 'm-roti-abon',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Roti Abon',
    price_idr: 10000,
    available: true,
    photo_path: null,
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
    photo_path: null,
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
    photo_path: null,
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
    photo_path: null,
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
    photo_path: null,
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
    photo_path: null,
    sort: 49,
    active: true,
    created_at: '',
    hue: 38,
  },
  {
    id: 'm-pizza-big',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Pizza Big',
    price_idr: 100000,
    available: true,
    photo_path: null,
    sort: 50,
    active: true,
    created_at: '',
    hue: 10,
  },
  // --- MENU DENGAN VARIAN (SATU KARTU DENGAN MODAL PILIHAN) ---
  {
    id: 'm-donat',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Donat',
    price_idr: 18000,
    available: true,
    photo_path: null,
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
    group_id: 'g-roti',
    name: 'Brownies',
    price_idr: 50000,
    available: true,
    photo_path: null,
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
    id: 'm-bolu-vanila',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Bolu Vanila',
    price_idr: 50000,
    available: true,
    photo_path: null,
    sort: 53,
    active: true,
    created_at: '',
    hue: 50,
    variants: [
      { name: 'Ukuran M', price_idr: 50000 },
      { name: 'Ukuran L', price_idr: 90000 },
    ],
  },
  {
    id: 'm-bolu-pandan',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Bolu Pandan',
    price_idr: 50000,
    available: true,
    photo_path: null,
    sort: 54,
    active: true,
    created_at: '',
    hue: 135,
    variants: [
      { name: 'Ukuran M', price_idr: 50000 },
      { name: 'Ukuran L', price_idr: 90000 },
    ],
  },
  {
    id: 'm-cake-ultah',
    shop_id: 'shop-001',
    group_id: 'g-roti',
    name: 'Cake Ultah',
    price_idr: 100000,
    available: true,
    photo_path: null,
    sort: 55,
    active: true,
    created_at: '',
    hue: 330,
    variants: [
      { name: 'Rp 100.000', price_idr: 100000 },
      { name: 'Rp 150.000', price_idr: 150000 },
      { name: 'Rp 200.000', price_idr: 200000 },
      { name: 'Rp 250.000', price_idr: 250000 },
      { name: 'Rp 350.000', price_idr: 350000 },
      { name: 'Rp 500.000', price_idr: 500000 },
      { name: 'Rp 750.000', price_idr: 750000 },
    ],
  },

  // --- MINUMAN: KOPI PANAS & ES KOPI ---
  {
    id: 'm-kopi-hitam',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Kopi Hitam',
    price_idr: 10000,
    available: true,
    photo_path: '/assets/images/minuman/minuman panas/kopi hitam.webp',
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
    photo_path: '/assets/images/minuman/minuman panas/kopi susu.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/americano.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/cappucino.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/mochacino.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/latte coffee.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/gula aren coffee.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/butterscotch latte.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/tiramisu coffee.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/hazelnut coffee.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/vanilla coffee.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/strawberry coffee.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/gula aren cream.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/pandan coffee.webp',
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
    photo_path: '/assets/images/minuman/ice coffee/melon coffee cream.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/es teh.webp',
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
    photo_path: '/assets/images/minuman/minuman panas/teh.webp',
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
    photo_path: '/assets/images/minuman/minuman panas/teh susu.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/es jeruk.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/lemon tea.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/teh tarik.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/thai tea.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/susu pandan.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/coklat ori.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/almond coklat.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/milo.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/cadbury.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/brown sugar.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/extra joss susu.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/taro.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/strawberry.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/mangga milky.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/red velvet.webp',
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
    photo_path: '/assets/images/minuman/ice non coffee/vanilla.webp',
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
    photo_path: '/assets/images/minuman/minuman special/green tea.webp',
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
    photo_path: '/assets/images/minuman/minuman special/matcha.webp',
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
    photo_path: '/assets/images/minuman/minuman panas/kopi susu.webp',
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
    photo_path: '/assets/images/minuman/minuman special/mangga squash.webp',
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
    photo_path: '/assets/images/minuman/minuman special/blue curacao.webp',
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
    photo_path: '/assets/images/minuman/minuman special/strawberry squash.webp',
    sort: 78,
    active: true,
    created_at: '',
    hue: 350,
  },
];

export const SEED_MENU_GROUPS: MenuGroup[] = [
  { id: 'g-makanan-1', shop_id: 'shop-001', category: 'makanan', name: 'Nasi goreng', icon_key: 'Nasi goreng', sort: 1 },
  { id: 'g-makanan-2', shop_id: 'shop-001', category: 'makanan', name: 'Nasi ayam', icon_key: 'Nasi ayam', sort: 2 },
  { id: 'g-makanan-3', shop_id: 'shop-001', category: 'makanan', name: 'Tradisional dan berkuah', icon_key: 'Tradisional dan berkuah', sort: 3 },
  { id: 'g-mie', shop_id: 'shop-001', category: 'mie', name: 'Mie', icon_key: 'Mie', sort: 4 },
  { id: 'g-snack', shop_id: 'shop-001', category: 'snack', name: 'Camilan dan roti', icon_key: 'Camilan', sort: 5 },
  { id: 'g-minuman', shop_id: 'shop-001', category: 'minuman', name: 'Kopi dan minuman', icon_key: 'Kopi', sort: 6 },
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
  fetchMenu: (shopId?: string) => Promise<void>;
  subscribeToMenuChanges: () => () => void;
}

const loadSavedAvailability = (initialItems: (MenuItem & { hue: number })[]) => {
  try {
    const raw = localStorage.getItem('tk_item_availability');
    if (raw) {
      const map: Record<string, boolean | { available: boolean }> = JSON.parse(raw);
      return initialItems.map((it) => {
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
  return initialItems;
};

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
      let query = (supabase.from('menu_items') as any).select('*').eq('active', true);
      if (shopId) query = query.eq('shop_id', shopId);
      const { data, error } = await query;
      if (error) {
        logError('menuStore:fetchMenu_query', error);
      } else if (data && data.length > 0) {
        // Ambil pemetaan status ketersediaan langsung dari database Supabase (Single Source of Truth)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbItemsById = new Map<string, any>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbItemsByName = new Map<string, any>();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any[]).forEach((row: any) => {
          if (row.id) dbItemsById.set(row.id, row);
          if (row.name) dbItemsByName.set(row.name.trim().toLowerCase(), row);
        });

        // Simpan pembaruan status dari database ke localStorage agar tersinkron saat offline
        try {
          const raw = localStorage.getItem('tk_item_availability');
          const localMap = raw ? JSON.parse(raw) : {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data as any[]).forEach((row: any) => {
            if (row.id) localMap[row.id] = Boolean(row.available);
            if (row.name) localMap[row.name.trim().toLowerCase()] = Boolean(row.available);
          });
          localStorage.setItem('tk_item_availability', JSON.stringify(localMap));
        } catch {
          // ignore
        }

        set((state) => ({
          items: state.items.map((item) => {
            const normName = item.name.trim().toLowerCase();
            const alias = MENU_NAME_ALIASES[normName];
            const matchingRow =
              dbItemsById.get(item.id) ||
              dbItemsByName.get(normName) ||
              (alias ? dbItemsByName.get(alias.trim().toLowerCase()) : undefined);

            if (matchingRow) {
              return {
                ...item,
                id: matchingRow.id || item.id, // Selaraskan ID lokal dengan UUID dari database Supabase
                available: Boolean(matchingRow.available), // Status akurat langsung dari database!
              };
            }

            return item;
          }),
        }));
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

