import { create } from 'zustand';
import { MenuItem, MenuGroup } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';

// Data menu awal lengkap dari MG, TR, HB HTML
export const SEED_MENU_ITEMS: (MenuItem & { hue: number })[] = [
  {
    id: 'm-01',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Mie Goreng Komplit',
    price_idr: 40000,
    available: true,
    photo_path: 'foto/mie-goreng-komplit.jpg',
    sort: 1,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-02',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Burger Daging',
    price_idr: 20000,
    available: true,
    photo_path: 'foto/burger-daging.jpg',
    sort: 2,
    active: true,
    created_at: '',
    hue: 18,
  },
  {
    id: 'm-03',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Kebab',
    price_idr: 30000,
    available: false, // Kebab contoh Habis
    photo_path: 'foto/kebab.jpg',
    sort: 3,
    active: true,
    created_at: '',
    hue: 35,
  },
  {
    id: 'm-04',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Nugget',
    price_idr: 15000,
    available: true,
    photo_path: 'foto/nugget.jpg',
    sort: 4,
    active: true,
    created_at: '',
    hue: 42,
  },
  {
    id: 'm-05',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Kopi Susu',
    price_idr: 15000,
    available: true,
    photo_path: 'foto/kopi-susu.jpg',
    sort: 5,
    active: true,
    created_at: '',
    hue: 25,
  },
  {
    id: 'm-06',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Es Teh',
    price_idr: 5000,
    available: true,
    photo_path: 'foto/es-teh.jpg',
    sort: 6,
    active: true,
    created_at: '',
    hue: 38,
  },
  {
    id: 'm-07',
    shop_id: 'shop-001',
    group_id: 'g-makanan',
    name: 'Nasi Goreng Telur',
    price_idr: 20000,
    available: true,
    photo_path: 'foto/nasi-goreng-telur.jpg',
    sort: 7,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-08',
    shop_id: 'shop-001',
    group_id: 'g-makanan',
    name: 'Nasi Ayam Penyet',
    price_idr: 35000,
    available: true,
    photo_path: 'foto/nasi-ayam-penyet.jpg',
    sort: 8,
    active: true,
    created_at: '',
    hue: 32,
  },
];

export const SEED_MENU_GROUPS: MenuGroup[] = [
  { id: 'g-makanan-1', shop_id: 'shop-001', category: 'makanan', name: 'Nasi goreng', icon_key: 'Nasi goreng', sort: 1 },
  { id: 'g-makanan-2', shop_id: 'shop-001', category: 'makanan', name: 'Nasi ayam', icon_key: 'Nasi ayam', sort: 2 },
  { id: 'g-makanan-3', shop_id: 'shop-001', category: 'makanan', name: 'Tradisional dan berkuah', icon_key: 'Tradisional dan berkuah', sort: 3 },
  { id: 'g-mie', shop_id: 'shop-001', category: 'mie', name: 'Mie', icon_key: 'Mie', sort: 4 },
  { id: 'g-snack-1', shop_id: 'shop-001', category: 'snack', name: 'Camilan', icon_key: 'Camilan', sort: 5 },
  { id: 'g-snack-2', shop_id: 'shop-001', category: 'snack', name: 'Burger dan roti', icon_key: 'Burger dan roti', sort: 6 },
  { id: 'g-minuman-1', shop_id: 'shop-001', category: 'minuman', name: 'Kopi panas', icon_key: 'Kopi panas', sort: 7 },
  { id: 'g-minuman-2', shop_id: 'shop-001', category: 'minuman', name: 'Teh dan cokelat panas', icon_key: 'Teh dan cokelat panas', sort: 8 },
  { id: 'g-minuman-3', shop_id: 'shop-001', category: 'minuman', name: 'Es kopi', icon_key: 'Es kopi', sort: 9 },
  { id: 'g-minuman-4', shop_id: 'shop-001', category: 'minuman', name: 'Es kopi rasa dan cream', icon_key: 'Es kopi rasa dan cream', sort: 10 },
  { id: 'g-minuman-5', shop_id: 'shop-001', category: 'minuman', name: 'Teh dan segar', icon_key: 'Teh dan segar', sort: 11 },
  { id: 'g-minuman-6', shop_id: 'shop-001', category: 'minuman', name: 'Cokelat dan susu', icon_key: 'Cokelat dan susu', sort: 12 },
  { id: 'g-minuman-7', shop_id: 'shop-001', category: 'minuman', name: 'Rasa lain', icon_key: 'Rasa lain', sort: 13 },
  { id: 'g-minuman-8', shop_id: 'shop-001', category: 'minuman', name: 'Minuman spesial', icon_key: 'Minuman spesial', sort: 14 },
];

export const TOP_SELLERS_DEFAULT: [string, number][] = [
  ['Nasi Goreng Telur', 20000],
  ['Nasi Ayam Penyet', 35000],
  ['Nasi Ayam Geprek', 25000],
  ['Gula Aren Coffee', 15000],
  ['Cappuccino', 15000],
  ['Brown Sugar', 15000],
  ['Milo', 15000],
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
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: SEED_MENU_ITEMS,
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
    // 1. Update lokal state dulu secara instan
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, available } : i)),
      heldItem: null,
    }));

    const targetItem = get().items.find((i) => i.id === itemId);
    const toast = targetItem
      ? available
        ? `${targetItem.name} tersedia lagi`
        : `${targetItem.name} ditandai habis`
      : 'Perubahan status disimpan';

    set({ toastMessage: toast });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 2500);

    // 2. Kirim ke Supabase RPC jika online
    if (isSupabaseConfigured()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.rpc as any)('set_item_availability', {
          p_item_id: itemId,
          p_available: available,
        });
      } catch {
        // Supabase error handled quietly
      }
    }
  },

  fetchMenu: async (shopId) => {
    if (!isSupabaseConfigured()) return;
    try {
      let query = supabase.from('menu_items').select('*').eq('active', true).order('sort');
      if (shopId) query = query.eq('shop_id', shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        set({ items: data as MenuItem[] });
      }
    } catch {
      // keep seed items
    }
  },
}));
