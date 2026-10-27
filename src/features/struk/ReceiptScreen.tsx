import React, { useRef, useState, useEffect } from 'react';
import { useCartStore } from '../../stores/cartStore.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { usePrinterStore } from '../../stores/printerStore.ts';
import { formatRupiah, formatDate, formatTime, formatQueueNo } from '../../lib/format/formatters.ts';
import { Button } from '../../design/components/Button.tsx';
import { Toast } from '../../design/components/Toast.tsx';
import { playPaymentSound } from '../../lib/sound/sound.ts';
import { useShopStore } from '../../stores/shopStore.ts';
import {
  ReceiptPrintPortal,
  printReceiptCrossPlatform,
  downloadReceiptPngCrossPlatform,
  shareReceiptCrossPlatform,
} from './ReceiptPrintPortal.tsx';

export interface ReceiptScreenProps {
  onNewOrder: () => void;
}

export const ReceiptScreen: React.FC<ReceiptScreenProps> = ({ onNewOrder }) => {
  const { shop } = useShopStore();
  const { lastOrder, lastOrderItems, notes } = useCartStore();
  const { activeCashier } = useCashierStore();
  const { autoPrint, isPrinting, isConnected: isPrinterConnected, printOrderReceipt } = usePrinterStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const hasAutoPrintedRef = useRef(false);

  // Putar audio assets/audio/payment_check.mp3 saat struk dimuat (didukung debounce)
  useEffect(() => {
    playPaymentSound();
  }, []);

  // Fallback data jika dibuka tanpa transaksi baru
  const orderDate = lastOrder?.created_at ? new Date(lastOrder.created_at) : new Date();
  const orderId = lastOrder?.id || 'ord-sample123';
  const tableNo = lastOrder?.table_no || '4';
  const queueNo = lastOrder?.queue_no || 1;
  const total = lastOrder?.total_idr || 0;
  const cashReceived = lastOrder?.cash_received_idr || total;
  const change = lastOrder?.change_idr || 0;
  const cashierName = activeCashier?.name || 'Robertus Amaresi';
  const paymentMethod = lastOrder?.payment_method || 'Tunai';
  const isQris = paymentMethod.toUpperCase() === 'QRIS';
  const isTransfer = paymentMethod.toLowerCase().includes('transfer');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Bagikan Struk secara adaptif (berkas gambar PNG atau teks WhatsApp) di Android, iOS, Windows, Mac
  const handleShare = async () => {
    await shareReceiptCrossPlatform({
      shopName: shop.name || 'Tati’e Kitchen',
      shopAddress: shop.address || 'Makassar',
      order: lastOrder,
      items: lastOrderItems,
      cashierName,
      element: receiptRef.current,
      onShowToast: showToast,
    });
  };

  // 2. Unduh Struk sebagai berkas PNG (mendukung Android WebView, iOS Safari, dan Laptop)
  const handleDownloadPng = async () => {
    if (!receiptRef.current) return;
    try {
      setIsDownloading(true);
      await downloadReceiptPngCrossPlatform({
        element: receiptRef.current,
        filename: `struk-${orderId}.png`,
        title: `Struk ${shop.name} #${formatQueueNo(queueNo)}`,
        onShowToast: showToast,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // 3. Cetak Struk lintas perangkat (Bluetooth printer jika terhubung, fallback ke dialog cetak sistem)
  const handlePrintReceipt = async () => {
    await printReceiptCrossPlatform({
      order: lastOrder,
      items: lastOrderItems,
      cashierName,
      notes,
      printOrderReceipt,
      isPrinterConnected,
      onShowToast: showToast,
    });
  };

  // Cetak otomatis jika fitur auto-print diaktifkan
  useEffect(() => {
    if (!hasAutoPrintedRef.current && autoPrint && lastOrder) {
      hasAutoPrintedRef.current = true;
      printOrderReceipt(lastOrder, lastOrderItems, cashierName, notes).then((ok) => {
        if (ok) {
          showToast(`Struk antrian #${formatQueueNo(queueNo)} otomatis dicetak`);
        }
      });
    }
  }, [autoPrint, lastOrder, lastOrderItems, cashierName, notes, queueNo, printOrderReceipt]);

  return (
    <div
      className="scr"
      style={{
        width: '1024px',
        height: '640px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '40px',
        padding: '24px 32px 84px 32px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Kolom Kiri: Kartu Struk Monospace (#fbfaf5) keluar dari Mesin Struk Kasir */}
      <div className="tk-receipt-printer-slot">
        <div
          ref={receiptRef}
          className="tk-receipt-card printing"
          style={{
            boxSizing: 'border-box',
            maxHeight: '520px',
            overflowY: 'auto',
          }}
        >
        <div className="center-bold" style={{ fontSize: '16px', marginBottom: '2px' }}>
          {shop.name}
        </div>
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#666666' }}>
          {shop.address}
        </div>

        <hr />

        {/* Tampilan Nomor Antrian Menonjol pada Struk Fisik */}
        <div style={{ textAlign: 'center', padding: '6px 0 2px 0' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#666666', fontWeight: 700 }}>
            NOMOR ANTRIAN
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1.1, color: '#111111', margin: '2px 0' }}>
            {formatQueueNo(queueNo)}
          </div>
        </div>

        <hr />

        <div className="row-between" style={{ fontSize: '12px' }}>
          <span>Waktu:</span>
          <span>{formatDate(orderDate)} {formatTime(orderDate)}</span>
        </div>
        <div className="row-between" style={{ fontSize: '12px' }}>
          <span>Kasir:</span>
          <span>{cashierName}</span>
        </div>
        <div className="row-between" style={{ fontSize: '12px' }}>
          <span>Meja:</span>
          <span>{tableNo}</span>
        </div>
        <div className="row-between" style={{ fontSize: '12px' }}>
          <span>No. Struk:</span>
          <span>{orderId.substring(0, 14)}</span>
        </div>

        <hr />

        {/* Daftar Item Pesanan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
          {lastOrderItems.length > 0 ? (
            lastOrderItems.map((item) => (
              <div key={item.id} className="row-between">
                <span>
                  {item.qty}x {item.name_snapshot}
                </span>
                <span>{formatRupiah(item.price_snapshot_idr * item.qty)}</span>
              </div>
            ))
          ) : (
            <div className="row-between">
              <span>1x Nasi Goreng Telur</span>
              <span>{formatRupiah(20000)}</span>
            </div>
          )}
        </div>

        {notes && (
          <div style={{ fontSize: '11px', color: '#555555', marginTop: '4px', fontStyle: 'italic' }}>
            Catatan: {notes}
          </div>
        )}

        <hr />

        <div className="row-between" style={{ fontWeight: 700 }}>
          <span>Total:</span>
          <span>{formatRupiah(total || 20000)}</span>
        </div>
        {isQris ? (
          <div className="row-between" style={{ fontWeight: 700 }}>
            <span>Metode:</span>
            <span>QRIS</span>
          </div>
        ) : isTransfer ? (
          <div className="row-between" style={{ fontWeight: 700 }}>
            <span>Metode:</span>
            <span>TF Bank</span>
          </div>
        ) : (
          <>
            <div className="row-between">
              <span>Tunai:</span>
              <span>{formatRupiah(cashReceived || 50000)}</span>
            </div>
            <div className="row-between" style={{ fontWeight: 700 }}>
              <span>Kembalian:</span>
              <span>{formatRupiah(change || 30000)}</span>
            </div>
          </>
        )}

        <hr />

        <div style={{ textAlign: 'center', fontSize: '11px', color: '#666666', marginTop: '6px' }}>
          Terima kasih atas kunjungan Anda!
        </div>
        </div>
      </div>

      {/* Kolom Kanan: Panel Konfirmasi, Unduh, Bagikan, & Pesanan Baru */}
      <div
        className="g-acrylic"
        style={{
          width: '360px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxSizing: 'border-box',
          borderRadius: 'var(--r-xl)',
          overflow: 'hidden',
        }}
      >
        <div className="tk-receipt-status-icon animated" aria-label="Pembayaran sukses">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', fontWeight: 800 }}>
            Pembayaran berhasil
          </h3>
          <p style={{ margin: '6px 0 0', color: 'var(--ink-2)', fontSize: 'var(--t-sm)' }}>
            {isQris ? 'Metode QRIS' : isTransfer ? 'Metode TF Bank' : `Kembalian ${formatRupiah(change)}`}
          </p>
        </div>

        {/* Kotak Nomor Antrian Menonjol */}
        <div
          style={{
            background: 'var(--card-sub)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '12px 20px',
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)', fontWeight: 700, letterSpacing: '0.05em' }}>
            NOMOR ANTRIAN
          </div>
          <div style={{ fontSize: 'var(--t-3xl)', lineHeight: 'var(--l-3xl)', fontWeight: 900, color: 'var(--accent-ink)', marginTop: '2px' }}>
            {formatQueueNo(queueNo)}
          </div>
        </div>

        {/* Tombol Cetak Struk, Bagikan Struk & Unduh PNG (minWidth: 0 agar pas rapi dalam kartu tanpa offside) */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '6px' }}>
          <Button
            variant="flat"
            size="md"
            onClick={handlePrintReceipt}
            disabled={isPrinting}
            style={{ flex: 1, minWidth: 0, fontSize: 'var(--t-xs)', padding: '0 4px', height: '44px' }}
          >
            {isPrinting ? 'Mencetak...' : 'Cetak'}
          </Button>
          <Button
            variant="flat"
            size="md"
            onClick={handleShare}
            style={{ flex: 1, minWidth: 0, fontSize: 'var(--t-xs)', padding: '0 4px', height: '44px' }}
          >
            Bagikan
          </Button>
          <Button
            variant="flat"
            size="md"
            onClick={handleDownloadPng}
            disabled={isDownloading}
            style={{ flex: 1, minWidth: 0, fontSize: 'var(--t-xs)', padding: '0 4px', height: '44px' }}
          >
            {isDownloading ? 'Menyimpan...' : 'Unduh'}
          </Button>
        </div>

        {/* Exactly ONE lime button per screen */}
        <Button
          variant="lime"
          onClick={onNewOrder}
          style={{ width: '100%', height: '52px', marginTop: '12px' }}
        >
          Pesanan baru
        </Button>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{ position: 'absolute', bottom: '88px', left: '50%', transform: 'translateX(-50%)', zIndex: 120 }}>
          <Toast message={toastMessage} />
        </div>
      )}

      {/* Portal Khusus Pencetakan Thermal Sistem (AirPrint / Android Print / Windows) */}
      <ReceiptPrintPortal
        shop={shop}
        order={lastOrder}
        items={lastOrderItems}
        cashierName={cashierName}
        notes={notes}
      />
    </div>
  );
};
