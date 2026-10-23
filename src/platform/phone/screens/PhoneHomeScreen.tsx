import React from 'react';
import { useLiveOrders } from '../hooks/useLiveOrders.ts';
import { useCashierStore } from '../../../stores/cashierStore.ts';
import { formatRupiah } from '../../../lib/format/formatters.ts';

export interface PhoneHomeScreenProps {
  onNavigateToHistory?: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export const PhoneHomeScreen: React.FC<PhoneHomeScreenProps> = ({
  onNavigateToHistory,
  onSelectOrder,
}) => {
  const {
    totalOmzet,
    totalCount,
    recentOrders,
    isLoading,
    isRealtimeActive,
  } = useLiveOrders();
  const { cashiers } = useCashierStore();

  const getCashierName = (cashierId?: string) => {
    if (!cashierId) return 'Kasir';
    const found = cashiers.find((c) => c.id === cashierId);
    return found ? found.name : 'Kasir';
  };

  return (
    <div className="tk-phone-screen">
      {/* Header dengan indikator sinkronisasi langsung */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '4px 4px 12px',
        }}
      >
        <h1 className="tk-phone-title" style={{ margin: 0 }}>
          Home
        </h1>

        {isRealtimeActive && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--t-xs)',
              lineHeight: 'var(--l-xs)',
              color: 'var(--accent)',
              fontWeight: 700,
              background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
              padding: '4px 10px',
              borderRadius: 'var(--r-pill)',
            }}
          >
            <span className="tk-phone-dot" style={{ width: '6px', height: '6px' }} />
            <span>Live</span>
          </div>
        )}
      </div>

      {/* Hero Card Ringkasan Omzet Hari Ini */}
      <div className="g-acrylic tk-phone-hero hi">
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
            style={{ height: '36px', width: '200px', margin: '6px 0', borderRadius: 'var(--r-sm)' }}
          />
        ) : (
          <b className="tk-phone-hero-amount">
            {formatRupiah(totalOmzet)}
          </b>
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

      {/* Bagian Transaksi Terbaru */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '16px 4px 8px',
        }}
      >
        <h2 className="tk-phone-section-title" style={{ margin: 0 }}>
          Terbaru
        </h2>
        {onNavigateToHistory && (
          <button
            type="button"
            onClick={onNavigateToHistory}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent)',
              fontSize: 'var(--t-xs)',
              lineHeight: 'var(--l-xs)',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Lihat semua ›
          </button>
        )}
      </div>

      {/* Daftar Transaksi Terbaru */}
      <div className="tk-phone-list-card">
        {isLoading && recentOrders.length === 0 ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="tk-skeleton" style={{ height: '44px', borderRadius: 'var(--r-sm)' }} />
            <div className="tk-skeleton" style={{ height: '44px', borderRadius: 'var(--r-sm)' }} />
            <div className="tk-skeleton" style={{ height: '44px', borderRadius: 'var(--r-sm)' }} />
          </div>
        ) : recentOrders.length === 0 ? (
          <div
            style={{
              padding: '28px 16px',
              textAlign: 'center',
              color: 'var(--ink-3)',
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
            }}
          >
            Belum ada transaksi hari ini
          </div>
        ) : (
          recentOrders.map(({ order, items }) => {
            const timeStr = order.created_at
              ? new Date(order.created_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '00.00';
            const cashierName = getCashierName(order.cashier_id);
            const totalQty = items?.reduce((sum, it) => sum + (it.qty || 1), 0) || items?.length || 1;

            return (
              <div
                key={order.id}
                className="tk-phone-row"
                onClick={() => {
                  if (onSelectOrder) {
                    onSelectOrder(order.id);
                  } else if (onNavigateToHistory) {
                    onNavigateToHistory();
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="tk-phone-dot" />
                  <div>
                    <b style={{ display: 'block', fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)' }}>
                      Meja {order.table_no}
                    </b>
                    <small
                      style={{
                        display: 'block',
                        color: 'var(--ink-3)',
                        fontSize: 'var(--t-xs)',
                        lineHeight: 'var(--l-xs)',
                        marginTop: '2px',
                      }}
                    >
                      {timeStr} WITA · {cashierName} · {totalQty} item
                    </small>
                  </div>
                </div>

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
                  <small
                    style={{
                      display: 'block',
                      color: 'var(--ink-3)',
                      fontSize: 'var(--t-xs)',
                      lineHeight: 'var(--l-xs)',
                      marginTop: '2px',
                    }}
                  >
                    Lunas
                  </small>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
