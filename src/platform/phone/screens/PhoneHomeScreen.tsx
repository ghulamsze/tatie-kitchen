import React from 'react';
import { useLiveOrders } from '../hooks/useLiveOrders.ts';
import { useHistoryStore } from '../../../stores/historyStore.ts';
import { formatRupiah, formatDate } from '../../../lib/format/formatters.ts';

export interface PhoneHomeScreenProps {
  onNavigateToHistory?: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export const PhoneHomeScreen: React.FC<PhoneHomeScreenProps> = ({
  onNavigateToHistory,
  onSelectOrder,
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

  return (
    <div className="tk-phone-screen" style={{ overflow: 'hidden' }}>
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
            <b
              className="tk-phone-hero-amount"
              style={{
                letterSpacing: isBalanceVisible ? '-0.02em' : '0.14em',
                fontSize: isBalanceVisible ? 'var(--t-xl)' : 'var(--t-lg)',
              }}
            >
              {isBalanceVisible ? formatRupiah(totalOmzet) : '● ● ● ● ● ●'}
            </b>

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
                transition: 'transform 0.1s ease, background 0.15s ease',
              }}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)';
              }}
              onPointerUp={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              {isBalanceVisible ? (
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
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
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
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
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

      {/* 3. Bagian Transaksi Terbaru */}
      <div style={{ margin: '16px 4px 6px' }}>
        <h2 className="tk-phone-section-title" style={{ margin: 0 }}>
          Terbaru
        </h2>
        <span
          style={{
            fontSize: 'var(--t-xs)',
            lineHeight: 'var(--l-xs)',
            color: 'var(--ink-3)',
            fontWeight: 600,
            display: 'block',
            marginTop: '2px',
          }}
        >
          {formatDate(new Date())}
        </span>
      </div>

      {/* 4. Daftar Transaksi Terbaru */}
      <div className="tk-phone-list-card">
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

                {/* Kolom Kanan: Nominal Rupiah & Jam Transaksi */}
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
                    {timeStr} · {order.payment_method?.toUpperCase() === 'QRIS' ? 'QRIS' : order.payment_method?.toLowerCase() === 'transfer' ? 'Transfer' : 'Tunai'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PhoneHomeScreen;
