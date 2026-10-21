import React, { useState } from 'react';
import { useMenuStore, TOP_SELLERS_DEFAULT } from '../../stores/menuStore.ts';
import { formatRupiah } from '../../lib/format/formatters.ts';
import { Button } from '../../design/components/Button.tsx';

export interface CustomerMenuViewProps {
  onClose: () => void;
}

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

  const isItemHabis = (name: string): boolean => {
    const found = items.find((i) => i.name.toLowerCase() === name.toLowerCase());
    return found ? !found.available : false;
  };

  return (
    <div className="scr tk-customer-menu-overlay" role="dialog" aria-modal="true" aria-label="Menu Lengkap Pembeli">
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '56px', flex: 'none' }}>
        <h2 style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', margin: 0, fontWeight: 800 }}>
          Menu Tati’e Kitchen
        </h2>
        <Button variant="flat" size="md" onClick={onClose} style={{ minWidth: '112px' }}>
          Tutup
        </Button>
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

      {/* Konten Menu Bergulir */}
      <div className="tk-customer-menu-grid">
        {/* Golden Triangle: Kotak Sorot Terlaris (Hanya jika kategori 'semua') */}
        {selectedCategory === 'semua' && (
          <div className="g-acrylic hi tk-highlight-box">
            <div
              className="tk-menu-card"
              style={{
                flex: '0 0 200px',
                minHeight: '168px',
              }}
            >
              <div
                className="photo-layer"
                style={{
                  background: 'radial-gradient(circle at 38% 48%, hsl(28 80% 60%) 0 20%, transparent 46%), hsl(28 40% 24%)',
                }}
              />
              <div className="blur-layer" />
              <b>Nasi Goreng Telur</b>
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="tk-menu-icon-box" style={{ width: '48px', height: '48px' }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '28px', height: '28px' }}>
                    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
                  </svg>
                </span>
                <h3 style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', fontWeight: 800, margin: 0 }}>
                  Terlaris
                </h3>
              </div>

              <div className="tk-highlight-items-grid">
                {TOP_SELLERS_DEFAULT.map(([name, price]) => {
                  const habis = isItemHabis(name);
                  return (
                    <div
                      key={name}
                      className="tk-customer-menu-item"
                      style={{ opacity: habis ? 0.55 : 1 }}
                    >
                      <b style={{ fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)' }}>{name}</b>
                      <span style={{ fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)', fontWeight: 800, color: habis ? 'var(--ink-3)' : 'var(--accent-ink)' }}>
                        {formatRupiah(price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Grup Menu Berdasarkan Kategori */}
        {items
          .filter((i) => i.available)
          .slice(0, 9)
          .map((item) => (
            <div key={item.id} className="g-acrylic" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span className="tk-menu-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </span>
                <b style={{ fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)' }}>{item.name}</b>
              </div>
              <span style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800, color: 'var(--accent-ink)' }}>
                {formatRupiah(item.price_idr)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};
