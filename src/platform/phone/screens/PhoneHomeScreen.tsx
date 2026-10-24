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
    <div className="tk-phone-screen">
      {/* 1. Header Bersih Sesuai Frame 1 PDF */}
      <h1 className="tk-phone-title">Home</h1>

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
                    {timeStr}
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
