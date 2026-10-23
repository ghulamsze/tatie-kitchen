import React from 'react';

/**
 * Komponen Animasi Wireframe Screen Refresh.
 * Menampilkan blueprint wireframe 1-ke-1 dari seluruh layar tablet
 * dengan laser scanning beam dan skeleton shimmer saat refresh berlangsung.
 */
export const ScreenWireframeRefresh: React.FC = () => {
  return (
    <div className="tk-wireframe-overlay" aria-live="polite" aria-busy="true">
      {/* 1. Laser Scanning Beam yang menyapu seluruh layar */}
      <div className="tk-wireframe-beam" />

      {/* 2. Floating Liquid Glass HUD di tengah layar */}
      <div className="tk-wireframe-hud">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '2.5px solid rgba(56, 189, 248, 0.25)',
              borderTopColor: '#38bdf8',
              borderRightColor: '#34d399',
              animation: 'tk-pull-spin 0.8s linear infinite',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 'var(--t-sm)',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 8px #34d399',
                display: 'inline-block',
              }}
            />
            Memperbarui Satu Layar
          </span>
        </div>
        <span
          style={{
            fontSize: 'var(--t-xs)',
            color: 'var(--ink-3)',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          Menyinkronkan data menu & transaksi realtime
        </span>
      </div>

      {/* 3. Blueprint Wireframe Layar Kasir */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Kolom Kiri: Katalog Wireframe */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '12px' }}>
          {/* Header Bar Wireframe */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              className="tk-wireframe-box tk-wireframe-shimmer"
              style={{ width: '180px', height: '36px', borderRadius: 'var(--r-sm)' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div
                className="tk-wireframe-box tk-wireframe-shimmer"
                style={{ width: '40px', height: '40px', borderRadius: 'var(--r-sm)' }}
              />
              <div
                className="tk-wireframe-box tk-wireframe-shimmer"
                style={{ width: '120px', height: '40px', borderRadius: 'var(--r-sm)' }}
              />
            </div>
          </div>

          {/* Search Bar Wireframe */}
          <div
            className="tk-wireframe-box tk-wireframe-shimmer"
            style={{ width: '100%', height: '44px', borderRadius: 'var(--r-md)' }}
          />

          {/* Category Chips Wireframe */}
          <div style={{ display: 'flex', gap: '8px', overflow: 'hidden' }}>
            {[72, 64, 80, 56, 78].map((w, idx) => (
              <div
                key={idx}
                className="tk-wireframe-box tk-wireframe-shimmer"
                style={{ width: `${w}px`, height: '32px', borderRadius: 'var(--r-pill)' }}
              />
            ))}
          </div>

          {/* Grid 6 Menu Cards Wireframe */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              alignContent: 'start',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="tk-wireframe-box"
                style={{
                  height: '148px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderRadius: 'var(--r-md)',
                  boxSizing: 'border-box',
                }}
              >
                {/* Photo box wireframe with blueprint cross */}
                <div
                  className="tk-wireframe-shimmer"
                  style={{
                    height: '76px',
                    borderRadius: 'var(--r-sm)',
                    border: '1px dashed rgba(56, 189, 248, 0.45)',
                    background: 'rgba(56, 189, 248, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.4)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                {/* Text lines wireframe */}
                <div
                  className="tk-wireframe-shimmer"
                  style={{
                    height: '12px',
                    width: '80%',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.2)',
                  }}
                />
                <div
                  className="tk-wireframe-shimmer"
                  style={{
                    height: '14px',
                    width: '50%',
                    borderRadius: '4px',
                    background: 'rgba(52, 211, 153, 0.25)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Keranjang Wireframe */}
        <div
          className="tk-wireframe-box"
          style={{
            width: '320px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            gap: '12px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Cart Wireframe */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              className="tk-wireframe-shimmer"
              style={{
                width: '100px',
                height: '20px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.25)',
              }}
            />
            <div
              className="tk-wireframe-shimmer"
              style={{
                width: '60px',
                height: '16px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.15)',
              }}
            />
          </div>

          {/* 3 Cart Items Wireframe */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                style={{
                  height: '48px',
                  borderRadius: 'var(--r-sm)',
                  border: '1px dashed rgba(56, 189, 248, 0.25)',
                  background: 'rgba(56, 189, 248, 0.04)',
                  padding: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '60%' }}>
                  <div
                    className="tk-wireframe-shimmer"
                    style={{
                      height: '10px',
                      width: '90%',
                      borderRadius: '3px',
                      background: 'rgba(56, 189, 248, 0.2)',
                    }}
                  />
                  <div
                    className="tk-wireframe-shimmer"
                    style={{
                      height: '8px',
                      width: '50%',
                      borderRadius: '3px',
                      background: 'rgba(52, 211, 153, 0.2)',
                    }}
                  />
                </div>
                <div
                  className="tk-wireframe-shimmer"
                  style={{
                    width: '32px',
                    height: '24px',
                    borderRadius: 'var(--r-sm)',
                    background: 'rgba(56, 189, 248, 0.15)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Cart Bottom Summary & Button Wireframe */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              className="tk-wireframe-shimmer"
              style={{
                width: '100%',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.12)',
              }}
            />
            <div
              className="tk-wireframe-shimmer"
              style={{
                width: '100%',
                height: '48px',
                borderRadius: 'var(--r-md)',
                border: '1.5px dashed rgba(52, 211, 153, 0.5)',
                background: 'rgba(52, 211, 153, 0.12)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
