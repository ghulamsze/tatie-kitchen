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
    group_id: 'g-makanan-3',
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
    group_id: 'g-snack',
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
    group_id: 'g-snack',
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
    id: 'm-bolu',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Bolu',
    price_idr: 50000,
    available: true,
    photo_path: null,
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
    group_id: 'g-snack',
    name: 'Cake Ultah',
    price_idr: 100000,
    available: true,
    photo_path: null,
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
  { id: 'g-makanan-1', shop_id: 'shop-001', category: 'makanan', name: 'Nasi goreng', icon_key: 'Nasi goreng', sort: 1 },
  { id: 'g-makanan-2', shop_id: 'shop-001', category: 'makanan', name: 'Nasi ayam', icon_key: 'Nasi ayam', sort: 2 },
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
  updateMenuItem: (updated: Partial<MenuItem> & { id: string }) => Promise<void>;
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
  return result;
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
        await (supabase.from('menu_items') as any).update({
          name: updated.name,
          price_idr: updated.price_idr,
          group_id: updated.group_id,
          available: updated.available,
          photo_path: updated.photo_path,
        }).eq('id', updated.id);
      } catch (err) {
        logError('menuStore:updateMenuItem', err);
      }
    }
  },

  addMenuItem: async (newItem) => {
    const newId = `m-${Date.now().toString(36)}`;
    const created: MenuItem & { hue: number } = {
      id: newId,
      shop_id: 'shop-001',
      group_id: newItem.group_id || 'g-snack',
      name: newItem.name,
      price_idr: newItem.price_idr || 0,
      available: newItem.available ?? true,
      photo_path: newItem.photo_path || null,
      sort: 99,
      active: true,
      created_at: new Date().toISOString(),
      hue: Math.floor(Math.random() * 360),
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
        await (supabase.from('menu_items') as any).insert({
          id: created.id,
          shop_id: created.shop_id,
          group_id: created.group_id,
          name: created.name,
          price_idr: created.price_idr,
          available: created.available,
          photo_path: created.photo_path,
          active: true,
          sort: created.sort,
        });
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

