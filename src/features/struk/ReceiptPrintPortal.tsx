import React from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { formatRupiah, formatDate, formatTime, formatQueueNo } from '../../lib/format/formatters.ts';
import { Order, OrderItem } from '../../lib/supabase/types.ts';

export interface ReceiptPrintPortalProps {
  shop: { name: string; address?: string };
  order: Order | null;
  items: OrderItem[];
  cashierName: string;
  notes?: string | null;
}

export const ReceiptPrintPortal: React.FC<ReceiptPrintPortalProps> = ({
  shop,
  order,
  items,
  cashierName,
  notes,
}) => {
  if (typeof document === 'undefined') return null;

  const orderDate = order?.created_at ? new Date(order.created_at) : new Date();
  const orderId = order?.id || 'ord-sample123';
  const tableNo = order?.table_no || '4';
  const queueNo = order?.queue_no || 1;
  const total = order?.total_idr || 0;
  const cashReceived = order?.cash_received_idr || total;
  const change = order?.change_idr || 0;
  const paymentMethod = order?.payment_method || 'Tunai';
  const isQris = paymentMethod.toUpperCase() === 'QRIS';
  const isTransfer = paymentMethod.toLowerCase().includes('transfer');

  return createPortal(
    <div id="tk-receipt-print-portal" aria-hidden="true">
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>
        {shop.name || 'Tati’e Kitchen'}
      </div>
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#333333' }}>
        {shop.address || 'Makassar'}
      </div>

      <hr />

      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.08em' }}>
          NOMOR ANTRIAN
        </div>
        <div style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: 1.1, margin: '2px 0' }}>
          {formatQueueNo(queueNo)}
        </div>
      </div>

      <hr />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span>Waktu:</span>
        <span>{formatDate(orderDate)} {formatTime(orderDate)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span>Kasir:</span>
        <span>{cashierName}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span>{tableNo === 'Bungkus' ? 'Pesanan:' : 'Meja:'}</span>
        <span>{tableNo}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span>No. Struk:</span>
        <span>{orderId.substring(0, 14)}</span>
      </div>

      <hr />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', margin: '4px 0' }}>
        {items.length > 0 ? (
          items.map((it, idx) => (
            <div key={it.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span>{it.qty}x {it.name_snapshot}</span>
              <span>{formatRupiah(it.price_snapshot_idr * it.qty)}</span>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span>1x Pesanan</span>
            <span>{formatRupiah(total || 20000)}</span>
          </div>
        )}
      </div>

      {notes && (
        <div style={{ fontSize: '9px', fontStyle: 'italic', margin: '3px 0' }}>
          Catatan: {notes}
        </div>
      )}

      <hr />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px' }}>
        <span>Total:</span>
        <span>{formatRupiah(total)}</span>
      </div>
      {isQris ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px' }}>
          <span>Metode:</span>
          <span>QRIS</span>
        </div>
      ) : isTransfer ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px' }}>
          <span>Metode:</span>
          <span>TF Bank</span>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span>Tunai:</span>
            <span>{formatRupiah(cashReceived)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px' }}>
            <span>Kembalian:</span>
            <span>{formatRupiah(change)}</span>
          </div>
        </>
      )}

      <hr />

      <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '6px' }}>
        Terima kasih atas kunjungan Anda!
      </div>
    </div>,
    document.body
  );
};

/**
 * Utilitas cetak lintas platform (Android Tablet/HP, iOS iPad/iPhone, Windows, Mac):
 * 1. Jika terhubung ke printer Bluetooth thermal, kirim perintah ESC/POS.
 * 2. Jika tidak terhubung / gagal, otomatis buka dialog cetak sistem (AirPrint / Android Print / Windows Print)
 */
export async function printReceiptCrossPlatform(options: {
  order: Order | null;
  items: OrderItem[];
  cashierName: string;
  notes?: string | null;
  printOrderReceipt: (order: Order, items: OrderItem[], cashier: string, notes?: string) => Promise<boolean>;
  isPrinterConnected: boolean;
  onShowToast: (msg: string) => void;
}): Promise<boolean> {
  const { order, items, cashierName, notes, printOrderReceipt, isPrinterConnected, onShowToast } = options;

  // 1. Coba lewat printer thermal Bluetooth jika tersambung
  if (isPrinterConnected && order) {
    try {
      const ok = await printOrderReceipt(order, items, cashierName, notes ?? undefined);
      if (ok) {
        onShowToast(`Struk antrian #${formatQueueNo(order.queue_no || 1)} dicetak via printer thermal!`);
        return true;
      }
    } catch {
      // Abaikan dan lanjut ke fallback sistem cetak
    }
  }

  // 2. Fallback cetak sistem (AirPrint di iOS, Android Print Spooler, atau dialog Windows/Mac)
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    document.body.classList.add('is-printing-receipt');
    setTimeout(() => {
      try {
        window.print();
        onShowToast('Membuka dialog cetak sistem...');
      } catch {
        onShowToast('Gagal memicu pencetakan sistem');
      } finally {
        setTimeout(() => {
          document.body.classList.remove('is-printing-receipt');
        }, 1500);
      }
    }, 80);
    return true;
  }

  onShowToast('Pencetakan tidak didukung pada peramban ini');
  return false;
}

/**
 * Utilitas unduh PNG struk lintas platform:
 * Mengonversi elemen struk menjadi Blob & Object URL agar didukung di Android WebView, iOS Safari, dan Laptop
 */
export async function downloadReceiptPngCrossPlatform(options: {
  element: HTMLElement;
  filename: string;
  title?: string;
  onShowToast: (msg: string) => void;
}): Promise<void> {
  const { element, filename, title = 'Struk Pembayaran', onShowToast } = options;

  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#fbfaf5',
    });

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: 'image/png' });

    // Pada iOS / Android jika peramban mendukung navigator.share dengan berkas:
    const isWindows = typeof navigator !== 'undefined' && /Windows NT|Win32|Win64|Windows/i.test(navigator.userAgent);
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Di Windows Desktop, jangan panggil navigator.share agar tidak membuka flyout Windows, langsung unduh via <a>
    if (!isWindows && isMobileDevice && (navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
      try {
        await navigator.share({
          title,
          files: [file],
        });
        onShowToast('Struk berhasil disimpan / dibagikan');
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Unduh berkas langsung via Blob URL (Standar di Windows Desktop & fallback perangkat lain)
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);

    onShowToast(isWindows ? 'Struk berhasil diunduh ke folder Downloads' : 'Struk berhasil diunduh sebagai gambar PNG');
  } catch {
    onShowToast('Gagal mengunduh gambar struk');
  }
}

/**
 * Utilitas bagikan struk lintas platform:
 * Mencoba membagikan gambar file PNG struk, dengan fallback teks WhatsApp/SMS atau salin ke papan klip
 */
export async function shareReceiptCrossPlatform(options: {
  shopName: string;
  shopAddress: string;
  order: Order | null;
  items: OrderItem[];
  cashierName: string;
  element?: HTMLElement | null;
  onShowToast: (msg: string) => void;
}): Promise<void> {
  const { shopName, shopAddress, order, items, cashierName, element, onShowToast } = options;

  const orderDate = order?.created_at ? new Date(order.created_at) : new Date();
  const queueNo = order?.queue_no || 1;
  const tableNo = order?.table_no || '-';
  const orderId = order?.id || 'ord-123';
  const total = order?.total_idr || 0;
  const cashReceived = order?.cash_received_idr || total;
  const change = order?.change_idr || 0;
  const paymentMethod = order?.payment_method || 'Tunai';
  const isQris = paymentMethod.toUpperCase() === 'QRIS';
  const isTransfer = paymentMethod.toLowerCase().includes('transfer');

  const linesSummary = items
    .map((it) => `${it.qty}x ${it.name_snapshot} (${formatRupiah(it.price_snapshot_idr * it.qty)})`)
    .join('\n');

  const paymentLine = isQris
    ? 'Metode: QRIS'
    : isTransfer
    ? 'Metode: TF Bank'
    : `Tunai: ${formatRupiah(cashReceived)}\nKembalian: ${formatRupiah(change)}`;

  const shareText = `*${shopName}*\n${shopAddress}\n*NOMOR ANTRIAN: ${formatQueueNo(queueNo)}*\nNo. Struk: ${orderId}\nMeja: ${tableNo}\nKasir: ${cashierName}\nWaktu: ${formatDate(orderDate)} ${formatTime(orderDate)}\n--------------------\n${linesSummary}\n--------------------\nTotal: ${formatRupiah(total)}\n${paymentLine}\n\nTerima kasih atas pesanan Anda!`;

  // Coba bagikan gambar file PNG jika element tersedia
  if (element && typeof navigator !== 'undefined' && navigator.share) {
    try {
      const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2, backgroundColor: '#fbfaf5' });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `struk-${orderId.substring(0, 8)}.png`, { type: 'image/png' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        await navigator.share({
          title: `Struk ${shopName} #${formatQueueNo(queueNo)}`,
          text: shareText,
          files: [file],
        });
        onShowToast('Struk berhasil dibagikan');
        return;
      }
    } catch {
      // lanjut fallback teks share
    }
  }

  // Fallback share teks standar
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `Struk ${shopName} - Meja ${tableNo} #${formatQueueNo(queueNo)}`,
        text: shareText,
      });
      onShowToast('Struk berhasil dibagikan');
      return;
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
    }
  }

  // Fallback salin ke papan klip
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(shareText);
    onShowToast('Ringkasan struk disalin ke papan klip');
  }
}
