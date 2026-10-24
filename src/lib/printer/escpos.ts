import { formatRupiah, formatDate, formatTime, formatQueueNo } from '../format/formatters.ts';
import { Order, OrderItem } from '../supabase/types.ts';

export const PRINTER_LINE_WIDTH = 32;

// Konstanta Byte Perintah ESC/POS Standar
export const ESC = 0x1b;
export const GS = 0x1d;

export const CMD_INIT = new Uint8Array([ESC, 0x40]); // ESC @
export const CMD_ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00]); // ESC a 0
export const CMD_ALIGN_CENTER = new Uint8Array([ESC, 0x61, 0x01]); // ESC a 1
export const CMD_ALIGN_RIGHT = new Uint8Array([ESC, 0x61, 0x02]); // ESC a 2

export const CMD_BOLD_ON = new Uint8Array([ESC, 0x45, 0x01]); // ESC E 1
export const CMD_BOLD_OFF = new Uint8Array([ESC, 0x45, 0x00]); // ESC E 0

export const CMD_SIZE_NORMAL = new Uint8Array([GS, 0x21, 0x00]); // GS ! 0
export const CMD_SIZE_DOUBLE_HEIGHT = new Uint8Array([GS, 0x21, 0x01]); // GS ! 1
export const CMD_SIZE_DOUBLE = new Uint8Array([GS, 0x21, 0x11]); // GS ! 17 (Double width + height)

export const CMD_FEED_4_LINES = new Uint8Array([ESC, 0x64, 0x04]); // ESC d 4
export const LF = 0x0a;

/**
 * Memformat dua kolom (kiri & kanan) agar pas tepat pada lebar kolom yang ditentukan.
 */
export function formatTwoCols(left: string, right: string, width = PRINTER_LINE_WIDTH): string {
  const leftTrim = left.trim();
  const rightTrim = right.trim();
  const spaceNeeded = width - leftTrim.length - rightTrim.length;

  if (spaceNeeded >= 1) {
    return leftTrim + ' '.repeat(spaceNeeded) + rightTrim;
  }

  // Jika terlalu panjang untuk satu baris, pisah baris dengan nilai kanan rata kanan
  const rightIndent = Math.max(0, width - rightTrim.length);
  return leftTrim + '\n' + ' '.repeat(rightIndent) + rightTrim;
}

/**
 * Garis pemisah putus-putus sepanjang lebar kertas struk (32 kolom)
 */
export function getDividerLine(char = '-', width = PRINTER_LINE_WIDTH): string {
  return char.repeat(width);
}

export interface ReceiptPrintData {
  order: Order;
  items: OrderItem[];
  cashierName?: string;
  notes?: string;
  shopName?: string;
  shopAddress?: string;
}

/**
 * Membangun buffer byte ESC/POS untuk pencetakan struk kasir termal 58mm
 */
export function buildReceiptEscPos(data: ReceiptPrintData): Uint8Array {
  const {
    order,
    items,
    cashierName = 'Kasir',
    notes,
    shopName = 'Tati’e Kitchen',
    shopAddress = 'Jl. Tamalate 2 No. 8, Makassar',
  } = data;

  const parts: (Uint8Array | number[])[] = [];

  const textEncoder = new TextEncoder();
  const addLine = (text: string) => {
    parts.push(textEncoder.encode(text + '\n'));
  };

  // 1. Inisialisasi printer
  parts.push(CMD_INIT);

  // 2. Header Toko (Tengah, Bold, Double Height)
  parts.push(CMD_ALIGN_CENTER);
  parts.push(CMD_BOLD_ON);
  parts.push(CMD_SIZE_DOUBLE_HEIGHT);
  addLine(shopName);

  // Alamat Toko (Ukuran Normal)
  parts.push(CMD_SIZE_NORMAL);
  parts.push(CMD_BOLD_OFF);
  addLine(shopAddress);

  // Garis pemisah
  addLine(getDividerLine());

  // 3. NOMOR ANTRIAN (Sangat Menonjol: Rata Tengah, Bold, Ukuran Double)
  parts.push(CMD_BOLD_ON);
  addLine('NOMOR ANTRIAN:');
  parts.push(CMD_SIZE_DOUBLE);
  addLine(formatQueueNo(order.queue_no || 1));

  parts.push(CMD_SIZE_NORMAL);
  parts.push(CMD_BOLD_OFF);
  addLine(getDividerLine());

  // 4. Metadata Transaksi (Rata Kiri, Format 2 Kolom)
  parts.push(CMD_ALIGN_LEFT);
  const orderDate = new Date(order.created_at);
  addLine(formatTwoCols('Waktu:', `${formatDate(orderDate)} ${formatTime(orderDate)}`));
  addLine(formatTwoCols('Kasir:', cashierName));
  addLine(formatTwoCols('Meja:', String(order.table_no || '-')));
  addLine(formatTwoCols('No. Struk:', order.id.substring(0, 14)));

  addLine(getDividerLine());

  // 5. Rincian Item Pesanan
  if (items.length > 0) {
    items.forEach((item) => {
      const itemTitle = `${item.qty}x ${item.name_snapshot}`;
      const itemPrice = formatRupiah(item.price_snapshot_idr * item.qty);
      addLine(formatTwoCols(itemTitle, itemPrice));
    });
  } else {
    addLine(formatTwoCols('1x Pesanan Toko', formatRupiah(order.total_idr)));
  }

  // Catatan pesanan jika ada
  if (notes && notes.trim()) {
    addLine(`Catatan: ${notes.trim()}`);
  }

  addLine(getDividerLine());

  // 6. Total Pembayaran & Kembalian (Bold untuk Total & Kembalian)
  parts.push(CMD_BOLD_ON);
  addLine(formatTwoCols('Total:', formatRupiah(order.total_idr)));
  parts.push(CMD_BOLD_OFF);

  const pm = (order.payment_method || 'tunai').toLowerCase();
  if (pm === 'qris') {
    parts.push(CMD_BOLD_ON);
    addLine(formatTwoCols('Metode:', 'QRIS'));
    parts.push(CMD_BOLD_OFF);
  } else if (pm.includes('transfer')) {
    parts.push(CMD_BOLD_ON);
    addLine(formatTwoCols('Metode:', 'Transfer Bank'));
    parts.push(CMD_BOLD_OFF);
  } else {
    addLine(formatTwoCols('Tunai:', formatRupiah(order.cash_received_idr)));
    parts.push(CMD_BOLD_ON);
    addLine(formatTwoCols('Kembalian:', formatRupiah(order.change_idr)));
    parts.push(CMD_BOLD_OFF);
  }

  addLine(getDividerLine());

  // 7. Footer Toko (Rata Tengah)
  parts.push(CMD_ALIGN_CENTER);
  addLine('Terima kasih atas pesanan Anda!');
  addLine('Tati’e Kitchen Makassar');

  // 8. Feed 4 baris kosong untuk memudahkan penyobekan manual pada tear bar
  parts.push(CMD_FEED_4_LINES);

  // Gabungkan semua potongan byte menjadi satu Uint8Array
  let totalLength = 0;
  parts.forEach((p) => {
    totalLength += p.length;
  });

  const finalBuffer = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach((p) => {
    const bytes = p instanceof Uint8Array ? p : new Uint8Array(p);
    finalBuffer.set(bytes, offset);
    offset += bytes.length;
  });

  return finalBuffer;
}

/**
 * Membangun buffer byte ESC/POS untuk uji coba cetak printer (Test Print)
 */
export function buildTestEscPos(): Uint8Array {
  const parts: (Uint8Array | number[])[] = [];
  const textEncoder = new TextEncoder();
  const addLine = (text: string) => {
    parts.push(textEncoder.encode(text + '\n'));
  };

  parts.push(CMD_INIT);
  parts.push(CMD_ALIGN_CENTER);
  parts.push(CMD_BOLD_ON);
  parts.push(CMD_SIZE_DOUBLE_HEIGHT);
  addLine('UJI COBA PRINTER');
  parts.push(CMD_SIZE_NORMAL);
  parts.push(CMD_BOLD_OFF);
  addLine('VSC MP-58X Thermal 58mm');
  addLine(getDividerLine());
  parts.push(CMD_ALIGN_LEFT);
  addLine(formatTwoCols('Status:', 'TERHUBUNG (OK)'));
  addLine(formatTwoCols('Lebar:', '32 Kolom (Font A)'));
  addLine(formatTwoCols('Waktu Uji:', formatTime(new Date())));
  addLine(getDividerLine());
  parts.push(CMD_ALIGN_CENTER);
  parts.push(CMD_BOLD_ON);
  addLine('NOMOR ANTRIAN UJI:');
  parts.push(CMD_SIZE_DOUBLE);
  addLine('001');
  parts.push(CMD_SIZE_NORMAL);
  parts.push(CMD_BOLD_OFF);
  addLine(getDividerLine());
  addLine('Sistem Cetak Siap Digunakan');
  parts.push(CMD_FEED_4_LINES);

  let totalLength = 0;
  parts.forEach((p) => (totalLength += p.length));
  const finalBuffer = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach((p) => {
    const bytes = p instanceof Uint8Array ? p : new Uint8Array(p);
    finalBuffer.set(bytes, offset);
    offset += bytes.length;
  });
  return finalBuffer;
}

/**
 * Utilitas untuk menguraikan byte ESC/POS menjadi teks ASCII bersih (untuk preview di browser/test)
 */
export function decodeEscPosToText(bytes: Uint8Array): string {
  const decoder = new TextDecoder('utf-8');
  let rawText = decoder.decode(bytes);

  // Bersihkan escape sequences ESC/POS umum
  // ESC @, ESC a n, ESC E n, GS ! n, ESC d n
  // eslint-disable-next-line no-control-regex
  rawText = rawText.replace(/\x1b[@aEd\x21][\x00-\x7f]?/g, '');
  // eslint-disable-next-line no-control-regex
  rawText = rawText.replace(/\x1d[\x21][\x00-\x7f]?/g, '');

  return rawText;
}
