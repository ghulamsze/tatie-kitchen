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
 * Mendapatkan zona waktu lokal perangkat secara otomatis
 */
export function getAutoTimezone(fallback = 'Asia/Makassar'): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Singkatan zona waktu (WITA, WIB, WIT, dll)
 */
export function getTimezoneAbbr(timeZone = getAutoTimezone()): string {
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
 * Format jam transaksi: contoh 10.01 WITA (pemisah titik, diikuti singkatan zona waktu otomatis)
 */
export function formatTime(date: Date | string = new Date(), timeZone = getAutoTimezone()): string {
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
export function formatDate(date: Date | string = new Date(), timeZone = getAutoTimezone()): string {
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
