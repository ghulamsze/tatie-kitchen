import React, { useState, useMemo, useEffect } from 'react';
import { useMenuStore } from '../../stores/menuStore.ts';
import { useHistoryStore } from '../../stores/historyStore.ts';
import { formatRupiah } from '../../lib/format/formatters.ts';
import { registerBackHandler } from '../../lib/device/backButton.ts';

export interface CustomerMenuViewProps {
  onClose: () => void;
}

interface MenuGroupDefinition {
  title: string;
  category: 'makanan' | 'mie' | 'snack' | 'roti' | 'minuman' | 'pizza' | 'kue';
  iconType: 'hot-coffee' | 'hot-tea' | 'iced-coffee' | 'rice' | 'noodle' | 'snack' | 'bread' | 'pizza' | 'cake';
  items: { name: string; defaultPrice: number }[];
}

const MENU_GROUPS_CATALOG: MenuGroupDefinition[] = [
  // --- MINUMAN ---
  {
    title: 'Kopi panas',
    category: 'minuman',
    iconType: 'hot-coffee',
    items: [
      { name: 'Kopi Hitam', defaultPrice: 10000 },
      { name: 'Kopi Susu', defaultPrice: 15000 },
      { name: 'Americano', defaultPrice: 15000 },
      { name: 'Cappuccino', defaultPrice: 15000 },
    ],
  },
  {
    title: 'Teh dan cokelat panas',
    category: 'minuman',
    iconType: 'hot-tea',
    items: [
      { name: 'Teh', defaultPrice: 5000 },
      { name: 'Teh Susu', defaultPrice: 15000 },
      { name: 'Cokelat Ori', defaultPrice: 15000 },
      { name: 'Milo', defaultPrice: 15000 },
    ],
  },
  {
    title: 'Es kopi',
    category: 'minuman',
    iconType: 'iced-coffee',
    items: [
      { name: 'Americano', defaultPrice: 10000 },
      { name: 'Cappuccino', defaultPrice: 15000 },
      { name: 'Mochachino', defaultPrice: 15000 },
      { name: 'Latte Coffee', defaultPrice: 15000 },
      { name: 'Kopi Susu', defaultPrice: 15000 },
      { name: 'Gula Aren Coffee', defaultPrice: 15000 },
    ],
  },
  {
    title: 'Cadburry & Signature',
    category: 'minuman',
    iconType: 'iced-coffee',
    items: [
      { name: 'Cadburry', defaultPrice: 15000 },
      { name: 'Cadburry Vanilla', defaultPrice: 18000 },
      { name: 'Cadburry Hazelnut', defaultPrice: 18000 },
      { name: 'Cadburry Caramel', defaultPrice: 18000 },
      { name: 'Cadburry Pandan', defaultPrice: 18000 },
      { name: 'Cadburry Mint', defaultPrice: 18000 },
      { name: 'Cadburry Banana', defaultPrice: 18000 },
    ],
  },
  {
    title: 'Varian Latte Spesial',
    category: 'minuman',
    iconType: 'hot-coffee',
    items: [
      { name: 'Hazelnut Latte', defaultPrice: 18000 },
      { name: 'Vanilla Latte', defaultPrice: 18000 },
      { name: 'Caramel Latte', defaultPrice: 18000 },
      { name: 'Pandan Latte', defaultPrice: 18000 },
      { name: 'Banana Latte', defaultPrice: 18000 },
      { name: 'Avocado Coffee', defaultPrice: 20000 },
    ],
  },
  {
    title: 'Teh & Non-Kopi Dingin',
    category: 'minuman',
    iconType: 'hot-tea',
    items: [
      { name: 'Teh Botol', defaultPrice: 5000 },
      { name: 'Es Teh', defaultPrice: 5000 },
      { name: 'Es Jeruk', defaultPrice: 10000 },
      { name: 'Lemon Tea', defaultPrice: 12000 },
      { name: 'Air Mineral', defaultPrice: 5000 },
    ],
  },

  // --- MAKANAN ---
  {
    title: 'Nasi goreng',
    category: 'makanan',
    iconType: 'rice',
    items: [
      { name: 'Nasi Goreng Telur', defaultPrice: 20000 },
      { name: 'Nasi Goreng Telur Ayam Suwir', defaultPrice: 25000 },
      { name: 'Nasi Goreng Ayam', defaultPrice: 33000 },
      { name: 'Nasi Goreng Ayam Komplit', defaultPrice: 38000 },
      { name: 'Nasi Goreng Mercon Telur', defaultPrice: 25000 },
      { name: 'Nasi Goreng Mercon Ayam', defaultPrice: 35000 },
      { name: 'Nasi Goreng Mercon Komplit', defaultPrice: 40000 },
    ],
  },
  {
    title: 'Nasi ayam',
    category: 'makanan',
    iconType: 'rice',
    items: [
      { name: 'Nasi Ayam Geprek', defaultPrice: 25000 },
      { name: 'Nasi Ayam Crispy', defaultPrice: 25000 },
      { name: 'Nasi Ayam Crispy Lava', defaultPrice: 30000 },
      { name: 'Nasi Ayam Lalap', defaultPrice: 35000 },
      { name: 'Nasi Ayam Penyet', defaultPrice: 35000 },
      { name: 'Nasi Ayam Bakar', defaultPrice: 35000 },
    ],
  },
  {
    title: 'Makanan berkuah',
    category: 'makanan',
    iconType: 'rice',
    items: [
      { name: 'Soto Ayam', defaultPrice: 25000 },
      { name: 'Coto Makassar', defaultPrice: 30000 },
    ],
  },

  // --- MIE ---
  {
    title: 'Mie kuah dan goreng',
    category: 'mie',
    iconType: 'noodle',
    items: [
      { name: 'Mie Goreng Komplit', defaultPrice: 40000 },
      { name: 'Mie Titi', defaultPrice: 30000 },
      { name: 'Mie Goreng Telur', defaultPrice: 25000 },
      { name: 'Mie Goreng Ayam', defaultPrice: 35000 },
      { name: 'Mie Goreng Mercon Telur', defaultPrice: 25000 },
      { name: 'Mie Goreng Mercon Ayam', defaultPrice: 35000 },
      { name: 'Mie Goreng Mercon Komplit', defaultPrice: 40000 },
    ],
  },

  // --- PIZZA ---
  {
    title: 'Pizza Spesial',
    category: 'pizza',
    iconType: 'pizza',
    items: [
      { name: 'Pizza', defaultPrice: 10000 },
    ],
  },

  // --- ROTI ---
  {
    title: 'Roti manis & isi',
    category: 'roti',
    iconType: 'bread',
    items: [
      { name: 'Roti Coklat', defaultPrice: 8000 },
      { name: 'Roti Keju', defaultPrice: 8000 },
      { name: 'Roti Meses', defaultPrice: 8000 },
      { name: 'Roti Cream Keju', defaultPrice: 10000 },
      { name: 'Roti Cream Meses', defaultPrice: 10000 },
      { name: 'Roti Bund Isi Coklat', defaultPrice: 10000 },
    ],
  },
  {
    title: 'Roti gurih, bakar & spesial',
    category: 'roti',
    iconType: 'bread',
    items: [
      { name: 'Roti Abon', defaultPrice: 10000 },
      { name: "Roti'O", defaultPrice: 10000 },
      { name: 'Roti Sosis', defaultPrice: 10000 },
      { name: 'Roti Pisang Coklat', defaultPrice: 10000 },
      { name: 'Roti Pintal Sosis', defaultPrice: 15000 },
      { name: 'Roti Sobek', defaultPrice: 30000 },
      { name: 'Roti Bakar', defaultPrice: 25000 },
      { name: 'Roti John', defaultPrice: 30000 },
    ],
  },

  // --- KUE ---
  {
    title: 'Kue, donat & brownies',
    category: 'kue',
    iconType: 'cake',
    items: [
      { name: 'Donat', defaultPrice: 18000 },
      { name: 'Brownies', defaultPrice: 50000 },
      { name: 'Bolu', defaultPrice: 50000 },
      { name: 'Pie Susu', defaultPrice: 10000 },
      { name: 'Pie Brownies', defaultPrice: 5000 },
      { name: 'Kue Ulang Tahun', defaultPrice: 100000 },
    ],
  },

  // --- SNACK ---
  {
    title: 'Gorengan & finger food',
    category: 'snack',
    iconType: 'snack',
    items: [
      { name: 'Risol', defaultPrice: 4000 },
      { name: 'Nugget', defaultPrice: 15000 },
      { name: 'Lekor', defaultPrice: 15000 },
      { name: 'Sosis Goreng', defaultPrice: 15000 },
      { name: 'Platter', defaultPrice: 25000 },
      { name: 'Pisang Nugget Cokelat', defaultPrice: 15000 },
      { name: 'Pisang Nugget Keju', defaultPrice: 15000 },
      { name: 'Pisang Nugget Cokelat Keju', defaultPrice: 18000 },
    ],
  },
  {
    title: 'Burger & kebab',
    category: 'snack',
    iconType: 'snack',
    items: [
      { name: 'Burger Telur', defaultPrice: 20000 },
      { name: 'Burger Daging', defaultPrice: 20000 },
      { name: 'Burger Komplit', defaultPrice: 25000 },
      { name: 'Kebab', defaultPrice: 30000 },
    ],
  },
];

const renderGroupIcon = (type: MenuGroupDefinition['iconType']) => {
  switch (type) {
    case 'hot-coffee':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    case 'hot-tea':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      );
    case 'iced-coffee':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 21h10a2 2 0 0 0 2-2L21 8H3l2 11a2 2 0 0 0 2 2Z" />
          <path d="M3 8l3-5h12l3 5" />
          <line x1="12" y1="3" x2="12" y2="8" />
        </svg>
      );
    case 'rice':
    case 'noodle':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11c0 4.97 4.03 9 9 9s9-4.03 9-9H3Z" />
          <path d="M12 2v4" />
          <path d="M7 4l2 3" />
          <path d="M17 4l-2 3" />
        </svg>
      );
    case 'bread':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6v4c0 3.3-2.7 6-6 6H9c-3.3 0-6-2.7-6-6v-4z" />
          <path d="M7 11c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2" />
        </svg>
      );
    case 'pizza':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 11h.01M11 15h.01M16 16h.01" />
          <path d="m2 16 17.5 5.5a1 1 0 0 0 1.2-1.2L15.2 2.8a1 1 0 0 0-1.6-.2L2 14.5a1 1 0 0 0 0 1.5Z" />
        </svg>
      );
    case 'cake':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
          <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
          <path d="M2 21h20" />
          <path d="M7 8v3" />
          <path d="M12 8v3" />
          <path d="M17 8v3" />
        </svg>
      );
    case 'snack':
    default:
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24" />
          <path d="m14.83 9.17 4.24-4.24" />
          <path d="m14.83 14.83 4.24 4.24" />
          <path d="m4.93 19.07 4.24-4.24" />
        </svg>
      );
  }
};

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'semua' | 'makanan' | 'mie' | 'minuman' | 'pizza' | 'roti' | 'kue' | 'snack'>('semua');
  const { items } = useMenuStore();
  const { orders } = useHistoryStore();

  // Tangani tombol ESC pada Windows dan Back button pada Android
  useEffect(() => {
    return registerBackHandler(() => {
      onClose();
      return true;
    }, 25);
  }, [onClose]);

  // Urutan kategori yang rapi dan terstruktur logis
  const categories = [
    { key: 'semua', label: 'Semua' },
    { key: 'makanan', label: 'Makanan' },
    { key: 'mie', label: 'Mie' },
    { key: 'minuman', label: 'Minuman' },
    { key: 'pizza', label: 'Pizza' },
    { key: 'roti', label: 'Roti' },
    { key: 'kue', label: 'Kue' },
    { key: 'snack', label: 'Snack' },
  ] as const;

  // Hitung menu terlaris secara dinamis berdasarkan data pesanan riil
  // Jika database 0, maka array terlaris kosong ([]), tidak menampilkan data palsu
  const topSellers = useMemo(() => {
    const soldCounts = new Map<string, { name: string; qty: number; price: number; photo_path: string | null; available: boolean }>();

    orders.forEach((h) => {
      if (h.order.status === 'cancelled') return;
      h.items.forEach((it) => {
        const key = it.name_snapshot.trim();
        const existing = soldCounts.get(key);
        if (existing) {
          existing.qty += it.qty;
        } else {
          const menuItem = items.find((m) => m.name.toLowerCase() === key.toLowerCase());
          soldCounts.set(key, {
            name: key,
            qty: it.qty,
            price: menuItem ? menuItem.price_idr : it.price_snapshot_idr,
            photo_path: menuItem?.photo_path || null,
            available: menuItem ? menuItem.available : true,
          });
        }
      });
    });

    return Array.from(soldCounts.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 9);
  }, [orders, items]);

  const getItemInfo = (name: string, fallbackPrice: number) => {
    const found = items.find((i) => i.name.toLowerCase() === name.toLowerCase());
    return {
      price: found ? found.price_idr : fallbackPrice,
      available: found ? found.available : true,
      variants: found?.variants,
    };
  };

  const renderItemPrice = (item: { name: string; defaultPrice: number }) => {
    const info = getItemInfo(item.name, item.defaultPrice);
    if (info.variants && info.variants.length > 0) {
      const minPrice = Math.min(...info.variants.map((v) => v.price_idr));
      const maxPrice = Math.max(...info.variants.map((v) => v.price_idr));
      if (minPrice !== maxPrice) {
        return `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
      }
    }
    return formatRupiah(info.price);
  };

  // Selalu sesuaikan dengan tambahan menu baru yang diinput di toko
  const allGroups = useMemo(() => {
    const groupsMap = new Map<string, MenuGroupDefinition>();
    MENU_GROUPS_CATALOG.forEach((grp) => {
      groupsMap.set(grp.title, { ...grp, items: [...grp.items] });
    });

    const catalogNames = new Set<string>();
    MENU_GROUPS_CATALOG.forEach((grp) => {
      grp.items.forEach((it) => catalogNames.add(it.name.toLowerCase()));
    });

    // Item dari store yang belum terdaftar di katalog statis
    const extraItems = items.filter(
      (it) => it.active !== false && !catalogNames.has(it.name.toLowerCase())
    );

    extraItems.forEach((it) => {
      let cat: 'makanan' | 'mie' | 'minuman' | 'pizza' | 'roti' | 'kue' | 'snack' = 'makanan';
      const gid = (it.group_id || '').toLowerCase();
      const itemCat = ((it as any).category || '').toLowerCase();

      if (gid.includes('makanan') || itemCat === 'makanan') cat = 'makanan';
      else if (gid.includes('mie') || itemCat === 'mie') cat = 'mie';
      else if (gid.includes('minuman') || gid.includes('coffee') || itemCat === 'minuman') cat = 'minuman';
      else if (gid.includes('pizza') || itemCat === 'pizza') cat = 'pizza';
      else if (gid.includes('roti') || itemCat === 'roti') cat = 'roti';
      else if (gid.includes('kue') || itemCat === 'kue') cat = 'kue';
      else if (gid.includes('snack') || itemCat === 'snack') cat = 'snack';

      const title = `Menu Tambahan ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
      if (!groupsMap.has(title)) {
        groupsMap.set(title, {
          title,
          category: cat,
          iconType:
            cat === 'minuman'
              ? 'iced-coffee'
              : cat === 'mie'
              ? 'noodle'
              : cat === 'pizza'
              ? 'pizza'
              : cat === 'roti'
              ? 'bread'
              : cat === 'kue'
              ? 'cake'
              : cat === 'snack'
              ? 'snack'
              : 'rice',
          items: [],
        });
      }
      groupsMap.get(title)!.items.push({
        name: it.name,
        defaultPrice: it.price_idr,
      });
    });

    return Array.from(groupsMap.values());
  }, [items]);

  const displayedGroups = useMemo(() => {
    if (selectedCategory === 'semua') return allGroups;
    return allGroups.filter((group) => group.category === selectedCategory);
  }, [allGroups, selectedCategory]);

  return (
    <div className="scr tk-customer-menu-overlay" role="dialog" aria-modal="true" aria-label="Menu Lengkap Pembeli">
      {/* Top Bar - Satu tombol icon saja tanpa teks */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '52px', flex: 'none', gap: '16px' }}>
        <button
          type="button"
          onClick={onClose}
          className="g-liquid tk-menu-back-icon-btn"
          aria-label="Tutup"
          title="Tutup menu"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--r-pill)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            border: '1px solid var(--ctl-line)',
            color: 'var(--ink)',
            background: 'color-mix(in srgb, var(--acrylic) 85%, transparent)',
            padding: 0,
            flex: 'none',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', margin: 0, fontWeight: 800, color: 'var(--ink)' }}>
          Menu Tati’e Kitchen
        </h2>
      </div>

      {/* Chip Kategori Filter */}
      <div style={{ display: 'flex', gap: '8px', flex: 'none', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`tk-chip ${selectedCategory === c.key ? 'active lime' : ''}`}
            onClick={() => setSelectedCategory(c.key)}
            aria-pressed={selectedCategory === c.key}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Konten Menu Bergulir */}
      <div className="tk-customer-menu-grid">
        {/* Kotak Sorot Terlaris (Hanya jika kategori 'semua') */}
        {selectedCategory === 'semua' && (
          <div className="g-acrylic hi tk-highlight-box" style={{ borderRadius: 'var(--r-lg)' }}>
            {topSellers.length > 0 ? (
              <>
                <div
                  className="tk-menu-card"
                  style={{
                    flex: '0 0 200px',
                    minHeight: '168px',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  <div
                    className="photo-layer"
                    style={{
                      background: topSellers[0].photo_path
                        ? `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.68) 100%), url('${topSellers[0].photo_path}') center/cover no-repeat`
                        : `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.68) 100%), var(--acrylic)`,
                    }}
                  />
                  <div className="blur-layer" />
                  <b style={{ color: '#ffffff' }}>{topSellers[0].name}</b>
                  <span style={{ fontSize: 'var(--t-xs)', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                    {topSellers[0].qty} terjual
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="tk-menu-icon-box" style={{ width: '44px', height: '44px' }}>
                      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '24px', height: '24px' }}>
                        <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
                      </svg>
                    </span>
                    <h3 style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                      Terlaris
                    </h3>
                  </div>

                  <div className="tk-highlight-items-grid">
                    {topSellers.map((item) => (
                      <div
                        key={item.name}
                        className="tk-customer-menu-item"
                        style={{ opacity: item.available ? 1 : 0.55 }}
                      >
                        <b style={{ fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)', color: 'var(--ink)' }}>{item.name}</b>
                        <span style={{ fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', fontWeight: 700, color: item.available ? 'var(--accent-ink)' : 'var(--ink-3)' }}>
                          {formatRupiah(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  width: '100%',
                  padding: '28px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                }}
              >
                <span
                  className="tk-menu-icon-box"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--ink-3)',
                    flexShrink: 0,
                  }}
                >
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
                  </svg>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                    Terlaris
                  </h3>
                  <p style={{ margin: 0, fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', color: 'var(--ink-3)' }}>
                    Belum ada data pesanan yang tercatat. Menu terlaris akan otomatis terdeteksi saat transaksi berlangsung.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kolom-Kolom Kartu Kelompok Menu */}
        {displayedGroups.length > 0 && (
          <div className="tk-menu-groups-container">
            {displayedGroups.map((group) => (
              <div key={group.title} className="g-acrylic tk-menu-group-card">
                {/* Header Grup Menu */}
                <div className="tk-menu-group-header">
                  <span className="tk-menu-icon-box" aria-hidden="true">
                    {renderGroupIcon(group.iconType)}
                  </span>
                  <h3 className="tk-menu-group-title">
                    {group.title}
                  </h3>
                </div>

                {/* List Menu di dalam Grup */}
                <div className="tk-menu-group-list">
                  {group.items.map((item) => {
                    const info = getItemInfo(item.name, item.defaultPrice);
                    return (
                      <div
                        key={item.name}
                        className="tk-menu-group-row"
                        style={{ opacity: info.available ? 1 : 0.5 }}
                      >
                        <div className="tk-menu-group-item-head">
                          <span className="tk-menu-group-bullet" aria-hidden="true" />
                          <span className="tk-menu-group-item-name">{item.name}</span>
                        </div>
                        <span className="tk-menu-group-item-price">
                          {renderItemPrice(item)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerMenuView;
