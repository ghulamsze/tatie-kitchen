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
  const timeStr = formatTime(order.created_at); // Contoh: "10.01 WITA" (sudah mengandung WITA)
  const dateStr = formatDate(order.created_at);
  const totalItemCount = items.reduce((acc, it) => acc + (it.qty || 1), 0);
  const cashReceived = order.cash_received_idr || order.total_idr;
  const changeAmount = order.change_idr || 0;

  // 1. Bagikan Struk Ringkas
  const handleShare = async () => {
    const linesSummary = items
      .map(
        (it) =>
          `${it.qty}x ${it.name_snapshot} (${formatRupiah(it.price_snapshot_idr * it.qty)})`
      )
      .join('\n');

    const shareText = `*${shop.name || 'Tati’e Kitchen'}*\n${shop.address || 'Makassar'}\n*NOMOR ANTRIAN: ${formatQueueNo(order.queue_no || 1)}*\nMeja: ${order.table_no || '-'}\nKasir: ${cashierName}\nWaktu: ${dateStr} ${timeStr}\n--------------------\n${linesSummary}\n--------------------\nTotal: ${formatRupiah(order.total_idr)}\nTunai: ${formatRupiah(cashReceived)}\nKembalian: ${formatRupiah(changeAmount)}\n\nTerima kasih atas pesanan Anda!`;

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

  // 2. Unduh Gambar Struk PNG yang Identik dengan Struk Tablet
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
      <div style={{ margin: '4px 4px 12px' }}>
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
            gap: '4px',
          }}
        >
          ‹ Rincian
        </button>
      </div>

      {/* 2. Hero Card Rincian Transaksi dengan Hierarki Jelas (Sesuai Konsep Struk Tablet) */}
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
        {/* Baris Meta Status & Waktu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--r-pill)',
              background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
              color: 'var(--accent)',
              fontSize: 'var(--t-xs)',
              fontWeight: 800,
            }}
          >
            ✓ Selesai
          </span>
          <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)', fontWeight: 600 }}>
            Meja {order.table_no || '-'} · {timeStr}
          </span>
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

        {/* Info Kasir */}
        <div
          style={{
            fontSize: 'var(--t-xs)',
            color: 'var(--ink-3)',
            fontWeight: 500,
            borderTop: '1px solid rgb(var(--w) / 0.08)',
            paddingTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Kasir: {cashierName}</span>
          <span>{dateStr}</span>
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

      {/* 4. Dua Tombol Aksi: Download PNG & Share */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          margin: '0 4px 24px',
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
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>📤</span>
          <span>Bagikan</span>
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
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>📥</span>
          <span>{isDownloading ? 'Menyimpan...' : 'Download PNG'}</span>
        </button>
      </div>

      {/* Notifikasi Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          visible={true}
        />
      )}

      {/* 5. Target Render Struk Fisik Thermal Persis Seperti Tablet Kasir (Hidden offscreen) */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '320px',
          zIndex: -1,
          pointerEvents: 'none',
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
            width: '320px',
          }}
        >
          {/* Header Kafe */}
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <b style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827' }}>
              {shop.name || 'TATI’E KITCHEN'}
            </b>
            <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
              {shop.address || 'Makassar'}
            </div>
            {/* Box Nomor Antrian Besar (Persis Tablet) */}
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: '#f3f4f6',
                borderRadius: '6px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#4b5563', letterSpacing: '0.05em' }}>
                NOMOR ANTRIAN
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#111827', lineHeight: 1.1 }}>
                {formatQueueNo(order.queue_no || 1)}
              </div>
            </div>
          </div>

          {/* Garis Pembatas */}
          <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '8px' }} />

          {/* Meta Transaksi */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
            <span>Waktu:</span>
            <span>{dateStr} {timeStr}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
            <span>Kasir:</span>
            <span>{cashierName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
            <span>Meja:</span>
            <span>{order.table_no || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563', marginBottom: '8px' }}>
            <span>No. Struk:</span>
            <span>{order.id.slice(0, 14)}</span>
          </div>

          {/* Garis Pembatas */}
          <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '10px' }} />

          {/* Daftar Item Pesanan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {items.map((it, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#111827' }}>
                  {it.qty}x {it.name_snapshot}
                </span>
                <b style={{ color: '#111827' }}>
                  {formatRupiah(it.price_snapshot_idr * it.qty)}
                </b>
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

          {/* Garis Pembatas */}
          <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '8px' }} />

          {/* Rincian Total, Tunai, Kembalian */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, marginBottom: '4px' }}>
            <span>TOTAL:</span>
            <span>{formatRupiah(order.total_idr)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>
            <span>Tunai:</span>
            <span>{formatRupiah(cashReceived)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
            <span>Kembalian:</span>
            <span>{formatRupiah(changeAmount)}</span>
          </div>

          {/* Garis Pembatas */}
          <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '10px' }} />

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280' }}>
            Terima kasih atas kunjungan Anda!
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneOrderDetailScreen;
