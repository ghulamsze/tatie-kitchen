import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { useHistoryStore } from '../../../stores/historyStore.ts';
import { useCashierStore } from '../../../stores/cashierStore.ts';
import { useShopStore } from '../../../stores/shopStore.ts';
import {
  formatRupiah,
  formatTime,
  formatDate,
  formatQueueNo,
} from '../../../lib/format/formatters.ts';
import { Toast } from '../../../design/components/Toast.tsx';

export interface PhoneOrderDetailScreenProps {
  onBack?: () => void;
}

export const PhoneOrderDetailScreen: React.FC<PhoneOrderDetailScreenProps> = ({ onBack }) => {
  const { selectedOrder } = useHistoryStore();
  const { cashiers } = useCashierStore();
  const { shop } = useShopStore();

  const hiddenReceiptRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!selectedOrder) {
    return (
      <div className="tk-phone-screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--ink-3)', fontSize: 'var(--t-sm)' }}>
          Tidak ada transaksi yang dipilih.
        </p>
        {onBack && (
          <button
            type="button"
            className="tk-btn-flat"
            onClick={onBack}
            style={{ marginTop: '12px' }}
          >
            ‹ Kembali
          </button>
        )}
      </div>
    );
  }

  const { order, items } = selectedOrder;
  const cashierFound = cashiers.find((c) => c.id === order.cashier_id);
  const cashierName = cashierFound ? cashierFound.name : 'Robertus Amaresi';
  const timeStr = formatTime(order.created_at);
  const dateStr = formatDate(order.created_at);
  const totalItemCount = items.reduce((acc, it) => acc + (it.qty || 1), 0);
  const cashReceived = order.cash_received_idr || order.total_idr;
  const changeAmount = order.change_idr || 0;
  const paymentMethod = order.payment_method || 'Tunai';
  const isQris = paymentMethod.toUpperCase() === 'QRIS';
  const isTransfer = paymentMethod.toLowerCase().includes('transfer');

  // 1. Bagikan Ringkasan Struk
  const handleShare = async () => {
    const linesSummary = items
      .map(
        (it) =>
          `${it.qty}x ${it.name_snapshot} (${formatRupiah(it.price_snapshot_idr * it.qty)})`
      )
      .join('\n');

    const paymentLine = isQris
      ? 'Metode: QRIS'
      : isTransfer
      ? 'Metode: Transfer Bank'
      : `Tunai: ${formatRupiah(cashReceived)}\nKembalian: ${formatRupiah(changeAmount)}`;

    const shareText = `*${shop.name || 'Tati’e Kitchen'}*\n${shop.address || 'Makassar'}\n*NOMOR ANTRIAN: ${formatQueueNo(order.queue_no || 1)}*\nMeja: ${order.table_no || '-'}\nKasir: ${cashierName}\nWaktu: ${dateStr} ${timeStr}\n--------------------\n${linesSummary}\n--------------------\nTotal: ${formatRupiah(order.total_idr)}\n${paymentLine}\n\nTerima kasih atas kunjungan Anda!`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Struk Meja ${order.table_no || '-'} #${formatQueueNo(order.queue_no || 1)}`,
          text: shareText,
        });
        showToast('Struk berhasil dibagikan');
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            showToast('Ringkasan struk disalin ke clipboard');
          }
        }
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      showToast('Ringkasan struk disalin ke clipboard');
    }
  };

  // 2. Unduh Gambar Struk PNG yang 100% Identik dengan Struk Tablet
  const handleDownloadPng = async () => {
    if (!hiddenReceiptRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(hiddenReceiptRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `struk-antrean-${formatQueueNo(order.queue_no || 1)}-meja-${order.table_no || '0'}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Struk berhasil diunduh sebagai gambar PNG');
    } catch {
      showToast('Gagal membuat gambar struk');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="tk-phone-screen">
      {/* 1. Navigasi Kembali di Kiri Atas */}
      <div style={{ margin: '8px 4px 14px 4px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--ink-2)',
            fontSize: 'var(--t-sm)',
            lineHeight: 'var(--l-sm)',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '6px 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>‹</span>
          <span>Rincian</span>
        </button>
      </div>

      {/* 2. Hero Card Rincian Transaksi */}
      <div
        className="g-acrylic"
        style={{
          borderRadius: 'var(--r-xl)',
          padding: '20px',
          margin: '0 4px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Baris Meja (Tanpa Badge Waktu / Selesai) */}
        <div>
          <b style={{ fontSize: 'var(--t-sm)', color: 'var(--ink)', fontWeight: 700 }}>
            Meja {order.table_no || '-'}
          </b>
        </div>

        {/* Kotak Nomor Antrian Menonjol (Sama seperti Tablet Kasir) */}
        <div
          style={{
            background: 'color-mix(in srgb, var(--ctl) 80%, rgb(var(--w) / 0.05))',
            border: '1px solid var(--ctl-line)',
            borderRadius: 'var(--r-md)',
            padding: '12px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--ink-2)',
              textTransform: 'uppercase',
            }}
          >
            Nomor Antrian
          </span>
          <b
            style={{
              fontSize: '32px',
              lineHeight: 1.1,
              fontWeight: 900,
              color: 'var(--accent)',
            }}
          >
            {formatQueueNo(order.queue_no || 1)}
          </b>
        </div>

        {/* Total Nominal Besar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
          <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)', fontWeight: 600 }}>
            Total Pembayaran
          </span>
          <b
            style={{
              fontSize: 'var(--t-2xl)',
              lineHeight: 'var(--l-2xl)',
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}
          >
            {formatRupiah(order.total_idr)}
          </b>
        </div>

        {/* Info Kasir & Pembayaran */}
        <div
          style={{
            fontSize: 'var(--t-xs)',
            color: 'var(--ink-3)',
            fontWeight: 500,
            borderTop: '1px solid var(--ctl-line)',
            paddingTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Kasir: {cashierName}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--r-full)',
                background: 'var(--surface-active)',
                color: 'var(--ink-2)',
                border: '1px solid var(--ctl-line)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {order.payment_method?.toUpperCase() === 'QRIS' ? 'QRIS' : order.payment_method?.toLowerCase() === 'transfer' ? 'Transfer' : 'Tunai'}
            </span>
            <span>{dateStr}</span>
          </div>
        </div>
      </div>

      {/* 3. Card Daftar Item Menu Pesanan */}
      <div
        className="g-acrylic"
        style={{
          borderRadius: 'var(--r-lg)',
          padding: '16px 20px',
          margin: '0 4px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontSize: 'var(--t-xs)',
            fontWeight: 800,
            color: 'var(--ink-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid rgb(var(--w) / 0.08)',
            paddingBottom: '8px',
          }}
        >
          Item Pesanan ({totalItemCount})
        </div>

        {items.map((it, idx) => (
          <div
            key={it.id || idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {it.qty}x {it.name_snapshot}
              </span>
              {it.qty > 1 && (
                <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>
                  @ {formatRupiah(it.price_snapshot_idr)}
                </span>
              )}
            </div>
            <b style={{ fontWeight: 700, color: 'var(--ink)' }}>
              {formatRupiah(it.price_snapshot_idr * it.qty)}
            </b>
          </div>
        ))}

        {order.notes && (
          <div
            style={{
              fontSize: 'var(--t-xs)',
              lineHeight: 'var(--l-xs)',
              color: 'var(--ink-3)',
              fontStyle: 'italic',
              background: 'rgb(var(--w) / 0.04)',
              padding: '8px 12px',
              borderRadius: 'var(--r-sm)',
              marginTop: '4px',
            }}
          >
            Catatan: {order.notes}
          </div>
        )}

        <div
          style={{
            height: '1px',
            background: 'rgb(var(--w) / 0.1)',
            margin: '4px 0',
          }}
        />

        {/* Ringkasan Subtotal, Tunai, Kembalian */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'var(--t-sm)',
              fontWeight: 800,
              color: 'var(--ink)',
            }}
          >
            <span>Total</span>
            <span>{formatRupiah(order.total_idr)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'var(--t-xs)',
              color: 'var(--ink-2)',
            }}
          >
            <span>Tunai</span>
            <span>{formatRupiah(cashReceived)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'var(--t-xs)',
              fontWeight: 700,
              color: 'var(--ink)',
            }}
          >
            <span>Kembalian</span>
            <span>{formatRupiah(changeAmount)}</span>
          </div>
        </div>
      </div>

      {/* 4. Dua Tombol Aksi: Download PNG (1 Baris) & Bagikan (Tanpa Emoji) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          margin: '0 4px 24px',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          className="tk-btn-flat"
          onClick={handleShare}
          style={{
            flex: 'none',
            padding: '0 16px',
            height: '48px',
            fontSize: 'var(--t-sm)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span style={{ whiteSpace: 'nowrap' }}>Bagikan</span>
        </button>

        <button
          type="button"
          className="tk-btn-lime"
          onClick={handleDownloadPng}
          disabled={isDownloading}
          style={{
            flex: 1,
            padding: '0 12px',
            height: '48px',
            fontSize: 'var(--t-sm)',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span style={{ whiteSpace: 'nowrap' }}>{isDownloading ? 'Menyimpan...' : 'Download PNG'}</span>
        </button>
      </div>

      {/* Notifikasi Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          visible={true}
        />
      )}

      {/* 5. Target Render Struk Fisik Monospace Identik 100% dengan Struk Tablet */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '300px',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <div
          ref={hiddenReceiptRef}
          className="tk-receipt-card"
          style={{
            boxSizing: 'border-box',
            width: '300px',
            background: '#fbfaf5',
            color: '#1f1e1d',
            borderRadius: '6px',
            padding: '24px 20px',
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: '14px',
            lineHeight: '20px',
          }}
        >
          <div className="center-bold" style={{ textAlign: 'center', fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>
            {shop.name || 'Tati’e Kitchen'}
          </div>
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#666666' }}>
            {shop.address || 'Makassar'}
          </div>

          <hr style={{ border: 0, borderTop: '1px dashed #999999', margin: '8px 0' }} />

          {/* Tampilan Nomor Antrian Menonjol pada Struk Fisik (Persis Tablet) */}
          <div style={{ textAlign: 'center', padding: '6px 0 2px 0' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#666666', fontWeight: 700 }}>
              NOMOR ANTRIAN
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1.1, color: '#111111', margin: '2px 0' }}>
              {formatQueueNo(order.queue_no || 1)}
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px dashed #999999', margin: '8px 0' }} />

          <div className="row-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Waktu:</span>
            <span>{dateStr} {timeStr}</span>
          </div>
          <div className="row-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Kasir:</span>
            <span>{cashierName}</span>
          </div>
          <div className="row-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Meja:</span>
            <span>{order.table_no || '-'}</span>
          </div>
          <div className="row-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>No. Struk:</span>
            <span>{order.id.substring(0, 14)}</span>
          </div>

          <hr style={{ border: 0, borderTop: '1px dashed #999999', margin: '8px 0' }} />

          {/* Daftar Item Pesanan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
            {items.map((item) => (
              <div key={item.id} className="row-between" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {item.qty}x {item.name_snapshot}
                </span>
                <span>{formatRupiah(item.price_snapshot_idr * item.qty)}</span>
              </div>
            ))}
          </div>

          {order.notes && (
            <div style={{ fontSize: '11px', color: '#555555', marginTop: '4px', fontStyle: 'italic' }}>
              Catatan: {order.notes}
            </div>
          )}

          <hr style={{ border: 0, borderTop: '1px dashed #999999', margin: '8px 0' }} />

          <div className="row-between" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total:</span>
            <span>{formatRupiah(order.total_idr)}</span>
          </div>
          {isQris ? (
            <div className="row-between" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Metode:</span>
              <span>QRIS</span>
            </div>
          ) : isTransfer ? (
            <div className="row-between" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Metode:</span>
              <span>Transfer Bank</span>
            </div>
          ) : (
            <>
              <div className="row-between" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tunai:</span>
                <span>{formatRupiah(cashReceived)}</span>
              </div>
              <div className="row-between" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Kembalian:</span>
                <span>{formatRupiah(changeAmount)}</span>
              </div>
            </>
          )}

          <hr style={{ border: 0, borderTop: '1px dashed #999999', margin: '8px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#666666', marginTop: '6px' }}>
            Terima kasih atas kunjungan Anda!
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneOrderDetailScreen;
