import React, { useState } from 'react';
import { useMenuStore, TOP_SELLERS_DEFAULT } from '../../stores/menuStore.ts';
import { formatRupiah } from '../../lib/format/formatters.ts';

export interface CustomerMenuViewProps {
  onClose: () => void;
}

interface MenuGroupDefinition {
  title: string;
  category: 'makanan' | 'mie' | 'snack' | 'minuman';
  iconType: 'hot-coffee' | 'hot-tea' | 'iced-coffee' | 'rice' | 'noodle' | 'snack';
  items: { name: string; defaultPrice: number }[];
}

const MENU_GROUPS_CATALOG: MenuGroupDefinition[] = [
  // --- MINUMAN (Dipecah maksimal 7 item per kelompok sesuai acuan gambar 2d) ---
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
    title: 'Tradisional dan berkuah',
    category: 'makanan',
    iconType: 'rice',
    items: [
      { name: 'Nasi Goreng Telur Tradisional', defaultPrice: 25000 },
      { name: 'Nasi Goreng Ayam Tradisional', defaultPrice: 35000 },
      { name: 'Nasi Goreng Tradisional Komplit', defaultPrice: 40000 },
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
      { name: 'Mie Kuah', defaultPrice: 30000 },
      { name: 'Mie Goreng Telur', defaultPrice: 25000 },
      { name: 'Mie Goreng Ayam', defaultPrice: 35000 },
      { name: 'Mie Goreng Mercon Telur', defaultPrice: 25000 },
      { name: 'Mie Goreng Mercon Ayam', defaultPrice: 35000 },
      { name: 'Mie Goreng Mercon Komplit', defaultPrice: 40000 },
    ],
  },
  {
    title: 'Mie tradisional',
    category: 'mie',
    iconType: 'noodle',
    items: [
      { name: 'Mie Goreng Tradisional Telur', defaultPrice: 25000 },
      { name: 'Mie Goreng Tradisional Ayam', defaultPrice: 35000 },
      { name: 'Mie Goreng Tradisional Komplit', defaultPrice: 40000 },
    ],
  },

  // --- SNACK ---
  {
    title: 'Gorengan & finger food',
    category: 'snack',
    iconType: 'snack',
    items: [
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
    title: 'Burger dan roti',
    category: 'snack',
    iconType: 'snack',
    items: [
      { name: 'Burger Telur', defaultPrice: 20000 },
      { name: 'Burger Daging', defaultPrice: 20000 },
      { name: 'Burger Komplit', defaultPrice: 25000 },
      { name: 'Roti Bakar', defaultPrice: 25000 },
      { name: 'Roti Jhon', defaultPrice: 30000 },
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
  const [selectedCategory, setSelectedCategory] = useState<'semua' | 'makanan' | 'mie' | 'snack' | 'minuman'>('semua');
  const { items } = useMenuStore();

  const categories = [
    { key: 'semua', label: 'Semua' },
    { key: 'makanan', label: 'Makanan' },
    { key: 'mie', label: 'Mie' },
    { key: 'snack', label: 'Snack' },
    { key: 'minuman', label: 'Minuman' },
  ] as const;

  const getItemInfo = (name: string, fallbackPrice: number) => {
    const found = items.find((i) => i.name.toLowerCase() === name.toLowerCase());
    return {
      price: found ? found.price_idr : fallbackPrice,
      available: found ? found.available : true,
    };
  };

  const displayedGroups = MENU_GROUPS_CATALOG.filter((group) => {
    if (selectedCategory === 'semua') return true;
    return group.category === selectedCategory;
  });

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
      <div style={{ display: 'flex', gap: '8px', flex: 'none' }}>
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

      {/* Konten Menu Bergulir Sesuai Gambar 2d */}
      <div className="tk-customer-menu-grid">
        {/* Golden Triangle: Kotak Sorot Terlaris (Hanya jika kategori 'semua') */}
        {selectedCategory === 'semua' && (
          <div className="g-acrylic hi tk-highlight-box" style={{ borderRadius: 'var(--r-lg)' }}>
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
                  background: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.68) 100%), url('/assets/images/makanan berat/nasgor telur.webp') center/cover no-repeat`,
                }}
              />
              <div className="blur-layer" />
              <b style={{ color: '#ffffff' }}>Nasi Goreng Telur</b>
              <span
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
                  fontSize: 'var(--t-xs)',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 'var(--r-pill)',
                  zIndex: 4,
                }}
              >
                Andalan
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
                {TOP_SELLERS_DEFAULT.map(([name, price]) => {
                  const info = getItemInfo(name, price);
                  return (
                    <div
                      key={name}
                      className="tk-customer-menu-item"
                      style={{ opacity: info.available ? 1 : 0.55 }}
                    >
                      <b style={{ fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)', color: 'var(--ink)' }}>{name}</b>
                      <span style={{ fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', fontWeight: 700, color: info.available ? 'var(--accent-ink)' : 'var(--ink-3)' }}>
                        {formatRupiah(info.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Kolom-Kolom Kartu Kelompok Menu (Grid 3 Kolom Rapi) */}
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

              {/* List Menu di dalam Grup (Maksimal 7 item per grup) */}
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
                        {formatRupiah(info.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
