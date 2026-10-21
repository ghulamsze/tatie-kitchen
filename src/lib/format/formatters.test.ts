import { describe, it, expect } from 'vitest';
import { formatRupiah, formatTime, formatDate, getAutoTimezone, getTimezoneAbbr } from './formatters.ts';

describe('Formatters Utility', () => {
  describe('formatRupiah', () => {
    it('harus menghasilkan format Rp tanpa spasi dan tanpa titik setelah Rp, titik hanya untuk ribuan', () => {
      expect(formatRupiah(80000)).toBe('Rp80.000');
      expect(formatRupiah(5000)).toBe('Rp5.000');
      expect(formatRupiah(120000)).toBe('Rp120.000');
      expect(formatRupiah(0)).toBe('Rp0');
    });

    it('harus menangani angka pecahan dengan pembulatan', () => {
      expect(formatRupiah(25000.4)).toBe('Rp25.000');
    });
  });

  describe('Zona Waktu & Tanggal Otomatis', () => {
    it('harus mendeteksi zona waktu otomatis', () => {
      const tz = getAutoTimezone();
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    });

    it('harus mengembalikan singkatan WITA untuk Makassar', () => {
      expect(getTimezoneAbbr('Asia/Makassar')).toBe('WITA');
      expect(getTimezoneAbbr('Asia/Jakarta')).toBe('WIB');
      expect(getTimezoneAbbr('Asia/Jayapura')).toBe('WIT');
    });

    it('harus memformat jam dengan pemisah titik dan singkatan zona waktu', () => {
      const testDate = new Date('2026-10-21T10:01:00+08:00');
      const formatted = formatTime(testDate, 'Asia/Makassar');
      expect(formatted).toBe('10.01 WITA');
    });

    it('harus memformat tanggal pendek Indonesia', () => {
      const testDate = new Date('2026-10-21T10:01:00+08:00');
      const formatted = formatDate(testDate, 'Asia/Makassar');
      expect(formatted).toBe('21 Okt 2026');
    });
  });
});
