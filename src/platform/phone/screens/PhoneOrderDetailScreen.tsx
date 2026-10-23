import React from 'react';
import { useHistoryStore } from '../../../stores/historyStore.ts';
import { formatRupiah, formatTime, formatDate } from '../../../lib/format/formatters.ts';

export interface PhoneOrderDetailScreenProps {
  onBack?: () => void;
}

export const PhoneOrderDetailScreen: React.FC<PhoneOrderDetailScreenProps> = ({ onBack }) => {
  const { selectedOrder } = useHistoryStore();

  if (!selectedOrder) {
    return (
      <div className="tk-phone-content" style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-3)' }}>Tidak ada transaksi yang dipilih.</p>
        {onBack && (
          <button type="button" className="tk-chip active lime" onClick={onBack}>
            Kembali ke Riwayat
          </button>
        )}
      </div>
    );
  }

  const { order, items } = selectedOrder;

  return (
    <div className="tk-phone-content" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {onBack && (
          <button
            type="button"
            className="tk-btn-flat"
            onClick={onBack}
            style={{ height: '36px', padding: '0 12px' }}
          >
            ← Kembali
          </button>
        )}
        <h3 style={{ margin: 0, fontSize: 'var(--t-lg)', fontWeight: 800 }}>Detail Pesanan</h3>
      </div>

      <div className="g-acrylic" style={{ padding: '16px', borderRadius: 'var(--r-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--ink-2)' }}>Nomor Meja</span>
          <b>Meja {order.table_no || '-'}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--ink-2)' }}>Waktu</span>
          <span>{formatDate(order.created_at)} {formatTime(order.created_at)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--ink-2)' }}>Status</span>
          <b style={{ color: 'var(--accent-ink)' }}>LUNAS</b>
        </div>
      </div>

      <div className="g-acrylic" style={{ padding: '16px', borderRadius: 'var(--r-md)' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--t-md)' }}>Daftar Item</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((it, idx) => (
            <div key={it.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ fontSize: 'var(--t-sm)' }}>{it.name_snapshot}</b>
                <small style={{ display: 'block', color: 'var(--ink-3)' }}>
                  {it.qty}x @ {formatRupiah(it.price_snapshot_idr)}
                </small>
              </div>
              <b>{formatRupiah(it.price_snapshot_idr * it.qty)}</b>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--ctl-line)', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800 }}>Total</span>
          <b style={{ fontSize: 'var(--t-lg)', color: 'var(--accent-ink)' }}>{formatRupiah(order.total_idr)}</b>
        </div>
      </div>
    </div>
  );
};

export default PhoneOrderDetailScreen;
