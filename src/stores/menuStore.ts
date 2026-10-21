import { create } from 'zustand';
import { MenuItem, MenuGroup } from '../lib/supabase/types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';

// Data menu awal lengkap dari MG, TR, HB HTML dengan URL foto makanan asli internet
export const SEED_MENU_ITEMS: (MenuItem & { hue: number })[] = [
  {
    id: 'm-01',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Mie Goreng Komplit',
    price_idr: 40000,
    available: true,
    photo_path: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
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
    photo_path: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
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
    available: false, // Kebab contoh Habis (tampilan abu-abu tanpa badge)
    photo_path: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80',
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
    photo_path: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80',
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
    photo_path: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
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
    photo_path: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
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
    photo_path: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
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
    photo_path: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
    sort: 8,
    active: true,
    created_at: '',
    hue: 32,
  },
  {
    id: 'm-09',
    shop_id: 'shop-001',
    group_id: 'g-makanan',
    name: 'Nasi Ayam Geprek',
    price_idr: 25000,
    available: true,
    photo_path: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
    sort: 9,
    active: true,
    created_at: '',
    hue: 30,
  },
  {
    id: 'm-10',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Burger Telur',
    price_idr: 20000,
    available: true,
    photo_path: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
    sort: 10,
    active: true,
    created_at: '',
    hue: 20,
  },
  {
    id: 'm-11',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Roti Jhon',
    price_idr: 30000,
    available: true,
    photo_path: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
    sort: 11,
    active: true,
    created_at: '',
    hue: 22,
  },
  {
    id: 'm-12',
    shop_id: 'shop-001',
    group_id: 'g-snack',
    name: 'Pisang Nugget Cokelat',
    price_idr: 15000,
    available: true,
    photo_path: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    sort: 12,
    active: true,
    created_at: '',
    hue: 24,
  },
  {
    id: 'm-13',
    shop_id: 'shop-001',
    group_id: 'g-mie',
    name: 'Mie Tek Tek',
    price_idr: 30000,
    available: true,
    photo_path: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    sort: 13,
    active: true,
    created_at: '',
    hue: 28,
  },
  {
    id: 'm-14',
    shop_id: 'shop-001',
    group_id: 'g-makanan',
    name: 'Coto Makassar',
    price_idr: 30000,
    available: true,
    photo_path: 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=600&auto=format&fit=crop&q=80',
    sort: 14,
    active: true,
    created_at: '',
    hue: 15,
  },
  {
    id: 'm-15',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Cappuccino',
    price_idr: 15000,
    available: true,
    photo_path: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
    sort: 15,
    active: true,
    created_at: '',
    hue: 26,
  },
  {
    id: 'm-16',
    shop_id: 'shop-001',
    group_id: 'g-minuman',
    name: 'Milo',
    price_idr: 15000,
    available: true,
    photo_path: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
    sort: 16,
    active: true,
    created_at: '',
    hue: 20,
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
