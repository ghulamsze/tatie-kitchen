import { useShopStore } from '../../stores/shopStore.ts';

/**
 * Format mata uang Rupiah: Simbol 'Rp' langsung angka tanpa spasi dan titik,
 * titik hanya untuk pemisah ribuan (contoh: Rp80.000).
 * Sesuai keputusan desain dan instruksi pemilik.
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp0';
  }
  const formattedNumber = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${formattedNumber}`;
}

/**
 * Format nomor antrian: minimal 3 digit (contoh: 001, 012, 100, 1000).
 */
export function formatQueueNo(queueNo: number | null | undefined): string {
  if (!queueNo || isNaN(queueNo) || queueNo <= 0) {
    return '001';
  }
  return queueNo < 1000 ? String(queueNo).padStart(3, '0') : String(queueNo);
}

/**
 * Mendapatkan zona waktu resmi toko: dibaca dari useShopStore atau default WITA (Asia/Makassar)
 */
export function getShopTimezone(): string {
  try {
    const tz = useShopStore.getState?.()?.shop?.timezone;
    if (tz) return tz;
  } catch {
    // fallback
  }
  return 'Asia/Makassar';
}

/**
 * Mendapatkan tanggal hari ini dalam format YYYY-MM-DD sesuai zona waktu toko (WITA)
 * Memastikan rollover nomor antrian terjadi tepat pukul 00:00 WITA.
 */
export function getShopTodayDateStr(date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: getShopTimezone() }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Mendapatkan zona waktu lokal perangkat secara otomatis
 */
export function getAutoTimezone(fallback = getShopTimezone()): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Singkatan zona waktu (WITA, WIB, WIT, dll)
 */
export function getTimezoneAbbr(timeZone = getShopTimezone()): string {
  if (timeZone === 'Asia/Makassar' || timeZone === 'Asia/Ujung_Pandang') return 'WITA';
  if (timeZone === 'Asia/Jakarta' || timeZone === 'Asia/Pontianak') return 'WIB';
  if (timeZone === 'Asia/Jayapura') return 'WIT';

  try {
    const parts = new Intl.DateTimeFormat('id-ID', {
      timeZone,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return 'WITA';
  }
}

/**
 * Format jam transaksi: contoh 10.01 WITA (pemisah titik, diikuti singkatan zona waktu resmi toko)
 */
export function formatTime(date: Date | string = new Date(), timeZone = getShopTimezone()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    const timeStr = new Intl.DateTimeFormat('id-ID', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d).replace(':', '.');

    const abbr = getTimezoneAbbr(timeZone);
    return abbr ? `${timeStr} ${abbr}` : timeStr;
  } catch {
    return '00.00 WITA';
  }
}

/**
 * Format tanggal pendek: contoh 21 Okt 2026
 */
export function formatDate(date: Date | string = new Date(), timeZone = getShopTimezone()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

/**
 * Menghitung timestamp awal hari (00:00:00) pada zona waktu toko (WITA)
 */
export function getStartOfDayInShopTimezone(date = new Date(), timeZone = getShopTimezone()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return new Date(`${year}-${month}-${day}T00:00:00+08:00`).getTime();
}

