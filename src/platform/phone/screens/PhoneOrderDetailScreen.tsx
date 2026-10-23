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

  // 1. Bagikan Struk
  const handleShare = async () => {
    const linesSummary = items
      .map(
        (it) =>
          `${it.qty}x ${it.name_snapshot} (${formatRupiah(it.price_snapshot_idr * it.qty)})`
      )
      .join('\n');

    const shareText = `*${shop.name || 'Tati’e Kitchen'}*\n${shop.address || 'Makassar'}\n*NOMOR ANTRIAN: ${formatQueueNo(order.queue_no || 1)}*\nMeja: ${order.table_no || '-'}\nKasir: ${cashierName}\nWaktu: ${dateStr} ${timeStr} WITA\n--------------------\n${linesSummary}\n--------------------\nTotal: ${formatRupiah(order.total_idr)}\n\nTerima kasih!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Struk Meja ${order.table_no || '-'}`,
          text: shareText,
        });
        showToast('Struk berhasil dibagikan');
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          await navigator.clipboard.writeText(shareText);
          showToast('Ringkasan struk disalin ke clipboard');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast('Ringkasan struk disalin ke clipboard');
    }
  };

  // 2. Unduh Gambar Struk PNG
  const handleDownloadPng = async () => {
    if (!hiddenReceiptRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(hiddenReceiptRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `struk-meja-${order.table_no || '0'}-${order.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Struk berhasil diunduh sebagai PNG');
    } catch {
      showToast('Gagal membuat gambar struk');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="tk-phone-screen">
      {/* 1. Tombol Kembali di Pojok Kiri Atas Sesuai Frame 4 PDF */}
      <div style={{ margin: '8px 4px 12px' }}>
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
            padding: '4px 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ‹ Rincian
        </button>
      </div>

      {/* 2. Sub-Header: Meja & Waktu */}
      <div
        style={{
          fontSize: 'var(--t-sm)',
          lineHeight: 'var(--l-sm)',
          color: 'var(--ink-2)',
          fontWeight: 600,
          margin: '0 4px 2px',
        }}
      >
        Meja {order.table_no || '-'} · {timeStr} WITA
      </div>

      {/* 3. Angka Total Nominal Besar */}
      <div
        style={{
          fontSize: 'var(--t-2xl)',
          lineHeight: 'var(--l-2xl)',
          fontWeight: 800,
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
          margin: '0 4px 4px',
        }}
      >
        {formatRupiah(order.total_idr)}
      </div>

      {/* 4. Baris Kasir */}
      <div
        style={{
          fontSize: 'var(--t-xs)',
          lineHeight: 'var(--l-xs)',
          color: 'var(--ink-3)',
          fontWeight: 500,
          margin: '0 4px 16px',
        }}
      >
        Kasir {cashierName}
      </div>

      {/* 5. Daftar Rincian Menu Pesanan (Card Acrylic) */}
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
        {items.map((it, idx) => (
          <div
            key={it.id || idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
              {it.qty} {it.name_snapshot}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
              {formatRupiah(it.price_snapshot_idr * it.qty)}
            </span>
          </div>
        ))}

        {order.notes && (
          <div
            style={{
              fontSize: 'var(--t-xs)',
              lineHeight: 'var(--l-xs)',
              color: 'var(--ink-3)',
              fontStyle: 'italic',
              marginTop: '-4px',
            }}
          >
            Catatan: {order.notes}
          </div>
        )}

        <div
          style={{
            height: '1px',
            background: 'rgba(255, 255, 255, 0.12)',
            margin: '4px 0',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--t-md)',
            lineHeight: 'var(--l-md)',
            fontWeight: 800,
          }}
        >
          <span>Total</span>
          <span>{formatRupiah(order.total_idr)}</span>
        </div>
      </div>

      {/* 6. Dua Tombol Aksi Berdampingan: Share (Flat) & Download PNG (Lime / Accent) */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          margin: '0 4px 16px',
        }}
      >
        <button
          type="button"
          className="tk-btn-flat"
          onClick={handleShare}
          style={{
            flex: 1,
            height: '48px',
            fontSize: 'var(--t-sm)',
          }}
        >
          Share
        </button>
        <button
          type="button"
          className="tk-btn-lime"
          onClick={handleDownloadPng}
          disabled={isDownloading}
          style={{
            flex: 1,
            height: '48px',
            fontSize: 'var(--t-sm)',
          }}
        >
          {isDownloading ? 'Memproses...' : 'Download PNG'}
        </button>
      </div>

      {/* Notifikasi Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          visible={true}
        />
      )}

      {/* Target Render Struk Tersembunyi Khusus Download PNG */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '320px',
        }}
      >
        <div
          ref={hiddenReceiptRef}
          style={{
            background: '#ffffff',
            color: '#111827',
            padding: '24px 20px',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: '13px',
            lineHeight: '1.4',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <b style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {shop.name || 'TATI’E KITCHEN'}
            </b>
            <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
              {shop.address || 'Makassar'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '8px' }}>
              ANTREAN: {formatQueueNo(order.queue_no || 1)}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#4b5563',
              marginBottom: '10px',
              borderBottom: '1px dashed #d1d5db',
              paddingBottom: '8px',
            }}
          >
            <span>{dateStr} {timeStr} WITA</span>
            <span>Meja {order.table_no || '-'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {items.map((it, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {it.qty}x {it.name_snapshot}
                </span>
                <b>{formatRupiah(it.price_snapshot_idr * it.qty)}</b>
              </div>
            ))}
          </div>

          {order.notes && (
            <div
              style={{
                fontSize: '11px',
                fontStyle: 'italic',
                color: '#6b7280',
                marginBottom: '10px',
              }}
            >
              Catatan: {order.notes}
            </div>
          )}

          <div
            style={{
              borderTop: '1px dashed #d1d5db',
              paddingTop: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: 800,
              marginBottom: '16px',
            }}
          >
            <span>TOTAL</span>
            <span>{formatRupiah(order.total_idr)}</span>
          </div>

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280' }}>
            Terima kasih atas pesanan Anda!
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneOrderDetailScreen;
