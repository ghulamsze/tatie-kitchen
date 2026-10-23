import React from 'react';
import { useHistoryStore } from '../../../stores/historyStore.ts';
import { formatRupiah } from '../../../lib/format/formatters.ts';

export const PhoneHistoryScreen: React.FC = () => {
  const { orders } = useHistoryStore();

  return (
    <div className="tk-phone-screen">
      <h1 className="tk-phone-title">Riwayat</h1>

      <div
        className="g-liquid"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderRadius: 'var(--r-pill)',
          fontWeight: 700,
          fontSize: 'var(--t-sm)',
          lineHeight: 'var(--l-sm)',
          margin: '0 4px 16px',
          cursor: 'pointer',
        }}
      >
        <span>Hari ini</span>
        <span style={{ color: 'var(--ink-3)' }}>▾</span>
      </div>

      <div className="tk-phone-list-card">
        <div className="tk-phone-date-header">
          Transaksi Terbaru
        </div>

        {orders.length === 0 ? (
          <div
            style={{
              padding: '28px 16px',
              textAlign: 'center',
              color: 'var(--ink-3)',
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
            }}
          >
            Belum ada riwayat transaksi
          </div>
        ) : (
          orders.map(({ order }) => {
            const timeStr = order.created_at
              ? new Date(order.created_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '00.00';

            return (
              <div key={order.id} className="tk-phone-row">
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
                    {timeStr} WITA
                  </small>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <b
                    style={{
                      display: 'block',
                      fontSize: 'var(--t-md)',
                      lineHeight: 'var(--l-md)',
                      fontWeight: 800,
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
