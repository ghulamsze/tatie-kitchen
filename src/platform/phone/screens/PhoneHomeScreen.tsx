import React from 'react';
import { useLiveOrders } from '../hooks/useLiveOrders.ts';
import { useHistoryStore } from '../../../stores/historyStore.ts';
import { formatRupiah, formatDate } from '../../../lib/format/formatters.ts';

// Komponen Ikon Mata dengan Animasi Kelopak / Coretan Halus Dinamis
const AnimatedEyeIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Kontur Bentuk Mata Proporsional */}
      <path
        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
        style={{
          transition: 'opacity 0.2s ease',
          opacity: isOpen ? 1 : 0.65,
        }}
      />

      {/* Pupil di Tengah (Mengecil & Memudar Mulus saat Tertutup) */}
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="currentColor"
        style={{
          transformOrigin: '12px 12px',
          transform: isOpen ? 'scale(1)' : 'scale(0)',
          opacity: isOpen ? 1 : 0,
          transition: 'transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.15s ease',
        }}
      />

      {/* Garis Coretan Diagonal Halus yang Menggambar saat Tertutup */}
      <line
        x1="3"
        y1="3"
        x2="21"
        y2="21"
        style={{
          strokeDasharray: 32,
          strokeDashoffset: isOpen ? 32 : 0,
          opacity: isOpen ? 0 : 1,
          transition: 'stroke-dashoffset 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.14s ease',
        }}
      />
    </svg>
  );
};

// Komponen Angka Berputar Vertikal Satu per Satu menjadi Titik / Angka dengan Sejajar Presisi & Jarak Rapi
const RollingAmount: React.FC<{ amount: number; isVisible: boolean }> = ({
  amount,
  isVisible,
}) => {
  const formatted = formatRupiah(amount);
  const numStr = formatted.startsWith('Rp') ? formatted.slice(2) : formatted;
  const chars = numStr.split('');

  // Hitung indeks digit untuk stagger animasi rotasi angka/titik
  let digitIndex = 0;

  return (
    <b
      className="tk-phone-hero-amount"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 'var(--t-xl)',
        lineHeight: 1,
        letterSpacing: '0',
        userSelect: 'none',
        height: '32px',
        paddingRight: '4px',
      }}
    >
      <span
        style={{
          fontSize: '0.82em',
          marginRight: '6px',
          opacity: 0.9,
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: 1,
          fontWeight: 700,
        }}
      >
        Rp
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: 1,
          height: '100%',
        }}
      >
        {chars.map((char, idx) => {
          const isSeparator = char === '.';
          const currentDigitIdx = isSeparator ? digitIndex : digitIndex++;

          if (isSeparator) {
            return (
              <span
                key={`sep-${idx}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  height: '100%',
                  width: isVisible ? '0.28em' : '0px',
                  opacity: isVisible ? 1 : 0,
                  overflow: 'hidden',
                  transition:
                    'width 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.16s ease',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isVisible
                      ? 'translateY(0%) rotateX(0deg)'
                      : 'translateY(-100%) rotateX(75deg)',
                    opacity: isVisible ? 1 : 0,
                    transition:
                      'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.16s ease',
                    transitionDelay: `${currentDigitIdx * 18}ms`,
                    willChange: 'transform, opacity',
                  }}
                >
                  .
                </span>
              </span>
            );
          }

          const digitWidth = isVisible
            ? char === '1'
              ? '0.40em'
              : '0.62em'
            : '0.52em';

          return (
            <span
              key={`digit-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                height: '100%',
                width: digitWidth,
                overflow: 'hidden',
                transition: 'width 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)',
                textAlign: 'center',
              }}
            >
              {/* Digit Angka Asli (Berputar ke atas saat menjadi titik) */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isVisible
                    ? 'translateY(0%) rotateX(0deg)'
                    : 'translateY(-100%) rotateX(75deg)',
                  opacity: isVisible ? 1 : 0,
                  transformOrigin: '50% 100%',
                  transition:
                    'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.16s ease',
                  transitionDelay: `${currentDigitIdx * 18}ms`,
                  willChange: 'transform, opacity',
                }}
              >
                {char}
              </span>

              {/* Titik Bulat Geometris Rapi (Berputar masuk dari bawah saat disembunyikan) */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: !isVisible
                    ? 'translateY(0%) rotateX(0deg)'
                    : 'translateY(100%) rotateX(-75deg)',
                  opacity: !isVisible ? 1 : 0,
                  transformOrigin: '50% 0%',
                  transition:
                    'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.16s ease',
                  transitionDelay: `${currentDigitIdx * 18}ms`,
                  willChange: 'transform, opacity',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: 'currentColor',
                    display: 'block',
                  }}
                />
              </span>
            </span>
          );
        })}
      </span>
    </b>
  );
};

export interface PhoneHomeScreenProps {
  onOpenAllHistory?: () => void;
  onOpenSalesReport?: () => void;
  onSelectOrder?: (orderId: string) => void;
  /** @deprecated gunakan onOpenAllHistory */
  onNavigateToHistory?: () => void;
}

export const PhoneHomeScreen: React.FC<PhoneHomeScreenProps> = ({
  onOpenAllHistory,
  onOpenSalesReport,
  onSelectOrder,
  onNavigateToHistory,
}) => {
  const { totalOmzet, totalCount, recentOrders, isLoading } = useLiveOrders();
  const [isBalanceVisible, setIsBalanceVisible] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('tk-show-omzet') !== 'false';
  });

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('tk-show-omzet', String(next));
      }
      return next;
    });
  };

  const handleRowClick = (item: { order: any; items: any[] }) => {
    useHistoryStore.getState().setSelectedOrder({
      order: item.order,
      items: item.items || [],
    });
    if (onSelectOrder) {
      onSelectOrder(item.order.id);
    } else if (onNavigateToHistory) {
      onNavigateToHistory();
    }
  };

  const handleAllHistoryClick = () => {
    if (onOpenAllHistory) {
      onOpenAllHistory();
    } else if (onNavigateToHistory) {
      onNavigateToHistory();
    }
  };

  return (
    <div
      className="tk-phone-screen tk-phone-scrollable tk-custom-slider"
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* 1. Header Bersih Sesuai Frame 1 PDF */}
      <h1 className="tk-phone-title">Beranda</h1>

      {/* 2. Hero Card Total Transaksi Hari Ini */}
      <div className="g-acrylic tk-phone-hero">
        <span
          style={{
            fontSize: 'var(--t-sm)',
            lineHeight: 'var(--l-sm)',
            color: 'var(--ink-2)',
            fontWeight: 500,
          }}
        >
          Total transaksi hari ini
        </span>

        {isLoading ? (
          <div
            className="tk-skeleton"
            style={{
              height: '36px',
              width: '200px',
              margin: '6px 0',
              borderRadius: 'var(--r-sm)',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '4px',
              marginBottom: '4px',
            }}
          >
            <RollingAmount amount={totalOmzet} isVisible={isBalanceVisible} />

            <button
              type="button"
              onClick={toggleBalanceVisibility}
              aria-label={isBalanceVisible ? 'Sembunyikan nominal' : 'Tampilkan nominal'}
              style={{
                background: 'var(--ctl)',
                border: '1px solid var(--ctl-line)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ink-2)',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                transition: 'transform 0.12s ease, background 0.15s ease',
              }}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(0.88)';
              }}
              onPointerUp={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              <AnimatedEyeIcon isOpen={isBalanceVisible} />
            </button>
          </div>
        )}

        <span
          style={{
            fontSize: 'var(--t-sm)',
            lineHeight: 'var(--l-sm)',
            color: 'var(--ink-3)',
            fontWeight: 700,
          }}
        >
          {totalCount} transaksi
        </span>
      </div>

      {/* 3. Bagian Transaksi Riwayat dengan Tombol Semua Riwayat di Sebelah Kanan */}
      <div
        style={{
          margin: '18px 4px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h2 className="tk-phone-section-title" style={{ margin: 0 }}>
            Riwayat
          </h2>
          <span
            style={{
              fontSize: 'var(--t-xs)',
              lineHeight: 'var(--l-xs)',
              color: 'var(--ink-3)',
              fontWeight: 600,
            }}
          >
            {formatDate(new Date())}
          </span>
        </div>

        {(onOpenAllHistory || onNavigateToHistory) && (
          <button
            type="button"
            onClick={handleAllHistoryClick}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 0',
              fontSize: 'var(--t-xs)',
              fontWeight: 700,
              color: 'var(--ink-2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            aria-label="Buka semua riwayat"
          >
            <span>Semua riwayat</span>
            <span style={{ fontSize: '15px', lineHeight: 1, color: 'var(--ink-3)' }}>›</span>
          </button>
        )}
      </div>

      {/* 4. Daftar Transaksi Terbaru (Slider aktif jika lebih dari 3 transaksi) */}
      <div
        className={`tk-phone-list-card ${recentOrders.length > 3 ? 'tk-custom-slider' : ''}`}
        style={{
          maxHeight: recentOrders.length > 3 ? '210px' : undefined,
          overflowY: recentOrders.length > 3 ? 'auto' : undefined,
          WebkitOverflowScrolling: 'touch',
          paddingRight: recentOrders.length > 3 ? '4px' : undefined,
        }}
      >
        {isLoading && recentOrders.length === 0 ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="tk-skeleton" style={{ height: '48px', borderRadius: 'var(--r-sm)' }} />
            <div className="tk-skeleton" style={{ height: '48px', borderRadius: 'var(--r-sm)' }} />
            <div className="tk-skeleton" style={{ height: '48px', borderRadius: 'var(--r-sm)' }} />
          </div>
        ) : recentOrders.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--ink-3)',
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
            }}
          >
            Belum ada transaksi hari ini
          </div>
        ) : (
          recentOrders.map((item) => {
            const { order, items } = item;
            const timeStr = order.created_at
              ? new Date(order.created_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Makassar',
                })
              : '00.00';
            const totalQty =
              items?.reduce((sum: number, it: any) => sum + (it.qty || 1), 0) ||
              items?.length ||
              1;
            const pm = (order.payment_method || 'tunai').toLowerCase();
            const methodLabel =
              pm === 'qris'
                ? 'QRIS'
                : pm.includes('transfer')
                ? 'TF Bank'
                : 'Tunai';

            return (
              <div
                key={order.id}
                className="tk-phone-row"
                onClick={() => handleRowClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleRowClick(item);
                  }
                }}
              >
                {/* Kolom Kiri: Meja & Jumlah Item */}
                <div>
                  <b
                    style={{
                      display: 'block',
                      fontSize: 'var(--t-md)',
                      lineHeight: 'var(--l-md)',
                      fontWeight: 800,
                      color: 'var(--ink)',
                    }}
                  >
                    Meja {order.table_no || '-'}
                  </b>
                  <span
                    style={{
                      display: 'block',
                      color: 'var(--ink-3)',
                      fontSize: 'var(--t-xs)',
                      lineHeight: 'var(--l-xs)',
                      marginTop: '2px',
                    }}
                  >
                    {totalQty} item
                  </span>
                </div>

                {/* Kolom Kanan: Nominal Rupiah, Jam Transaksi, & Metode Pembayaran */}
                <div style={{ textAlign: 'right' }}>
                  <b
                    style={{
                      display: 'block',
                      fontSize: 'var(--t-md)',
                      lineHeight: 'var(--l-md)',
                      fontWeight: 800,
                      color: 'var(--ink)',
                    }}
                  >
                    {formatRupiah(order.total_idr)}
                  </b>
                  <span
                    style={{
                      display: 'block',
                      color: 'var(--ink-3)',
                      fontSize: 'var(--t-xs)',
                      lineHeight: 'var(--l-xs)',
                      marginTop: '2px',
                    }}
                  >
                    {timeStr} · {methodLabel}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Tombol Laporan Penjualan (Opacity & Material Identik dengan Total Transaksi di Atas) */}
      {onOpenSalesReport && (
        <div style={{ marginTop: '14px', marginInline: '4px' }}>
          <button
            type="button"
            onClick={onOpenSalesReport}
            className="g-acrylic"
            style={{
              width: '100%',
              height: '52px',
              minHeight: '52px',
              padding: '0 20px',
              borderRadius: 'var(--r-pill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
              color: 'var(--ink)',
              transition: 'transform 0.1s ease, filter 0.15s ease',
            }}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
            }}
            onPointerUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
            aria-label="Buka Laporan Penjualan"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--accent)' }}
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Laporan Penjualan</span>
            </span>
            <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>›</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PhoneHomeScreen;
