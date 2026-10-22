import { describe, it, expect } from 'vitest';
import {
  formatTwoCols,
  getDividerLine,
  buildReceiptEscPos,
  buildTestEscPos,
  decodeEscPosToText,
  CMD_INIT,
  CMD_FEED_4_LINES,
} from './escpos.ts';
import { MockPreviewDriver } from './MockPreviewDriver.ts';
import { Order, OrderItem } from '../supabase/types.ts';

describe('Sistem Cetak Printer Thermal Bluetooth VSC MP-58X (Part 2)', () => {
  describe('1. Format Kolom & Garis Pemisah (32 Kolom)', () => {
    it('harus menghasilkan teks 32 karakter untuk formatTwoCols jika muat satu baris', () => {
      const line = formatTwoCols('Total:', 'Rp40.000');
      expect(line.length).toBe(32);
      expect(line.startsWith('Total:')).toBe(true);
      expect(line.endsWith('Rp40.000')).toBe(true);
    });

    it('harus memisahkan baris jika teks gabungan melebihi 32 karakter dengan baris kedua rata kanan', () => {
      const longLeft = '1x Nasi Goreng Komplit Spesial Telur';
      const right = 'Rp45.000';
      const line = formatTwoCols(longLeft, right);
      expect(line).toContain('\n');
      const [l1, l2] = line.split('\n');
      expect(l1).toBe(longLeft);
      expect(l2.length).toBe(32);
      expect(l2.endsWith(right)).toBe(true);
    });

    it('harus menghasilkan garis pemisah tepat 32 karakter', () => {
      const divider = getDividerLine();
      expect(divider.length).toBe(32);
      expect(divider).toBe('--------------------------------');
    });
  });

  describe('2. ESC/POS Receipt Builder', () => {
    const mockOrder: Order = {
      id: 'ord-test-print-12345678',
      shop_id: 'shop-01',
      cashier_id: 'c-01',
      device_id: null,
      table_no: '5',
      total_idr: 45000,
      cash_received_idr: 50000,
      change_idr: 5000,
      status: 'paid',
      queue_no: 7,
      business_date: '2026-10-22',
      created_at: '2026-10-22T14:30:00+08:00',
    };

    const mockItems: OrderItem[] = [
      {
        id: 'item-1',
        order_id: mockOrder.id,
        menu_item_id: 'm-1',
        name_snapshot: 'Nasi Ayam Penyet',
        price_snapshot_idr: 25000,
        qty: 1,
      },
      {
        id: 'item-2',
        order_id: mockOrder.id,
        menu_item_id: 'm-2',
        name_snapshot: 'Es Teh Manis',
        price_snapshot_idr: 10000,
        qty: 2,
      },
    ];

    it('harus menyertakan perintah inisialisasi printer (ESC @) di awal', () => {
      const bytes = buildReceiptEscPos({
        order: mockOrder,
        items: mockItems,
        cashierName: 'Robertus Amaresi',
      });

      expect(bytes[0]).toBe(CMD_INIT[0]);
      expect(bytes[1]).toBe(CMD_INIT[1]);
    });

    it('harus menyertakan nomor antrian 007 dengan format menonjol', () => {
      const bytes = buildReceiptEscPos({
        order: mockOrder,
        items: mockItems,
        cashierName: 'Robertus Amaresi',
      });

      // Uraikan byte ke teks
      const text = decodeEscPosToText(bytes);
      expect(text).toContain('NOMOR ANTRIAN:');
      expect(text).toContain('007');
      expect(text).toContain('Meja:');
      expect(text).toContain('5');
      expect(text).toContain('Total:');
      expect(text).toContain('Rp45.000');
      expect(text).toContain('Kembalian:');
      expect(text).toContain('Rp5.000');
    });

    it('harus menyertakan perintah feed 4 baris di akhir cetakan untuk tear bar', () => {
      const bytes = buildReceiptEscPos({
        order: mockOrder,
        items: mockItems,
      });

      const len = bytes.length;
      expect(bytes[len - 3]).toBe(CMD_FEED_4_LINES[0]); // ESC (0x1b)
      expect(bytes[len - 2]).toBe(CMD_FEED_4_LINES[1]); // 'd' (0x64)
      expect(bytes[len - 1]).toBe(CMD_FEED_4_LINES[2]); // 4 (0x04)
    });

    it('harus membangun uji cetak (test print) dengan benar', () => {
      const testBytes = buildTestEscPos();
      expect(testBytes.length).toBeGreaterThan(50);
      const testText = decodeEscPosToText(testBytes);
      expect(testText).toContain('UJI COBA PRINTER');
      expect(testText).toContain('VSC MP-58X');
      expect(testText).toContain('NOMOR ANTRIAN UJI:');
      expect(testText).toContain('001');
    });
  });

  describe('3. MockPreviewDriver (Simulasi Web / Laptop)', () => {
    it('harus mengizinkan koneksi, pencetakan, dan pencatatan teks struk bersih', async () => {
      const driver = new MockPreviewDriver();

      expect(await driver.isAvailable()).toBe(true);
      expect(await driver.isConnected()).toBe(true);

      const bonded = await driver.listBondedDevices();
      expect(bonded.length).toBeGreaterThanOrEqual(1);
      expect(bonded[0].name).toContain('VSC MP-58X');

      const testBytes = buildTestEscPos();
      const printSuccess = await driver.printRaw(testBytes);
      expect(printSuccess).toBe(true);
      expect(driver.lastPrintedText).toContain('UJI COBA PRINTER');
      expect(driver.lastPrintedText).toContain('VSC MP-58X');

      await driver.disconnect();
      expect(await driver.isConnected()).toBe(false);

      // Setelah disconnect, print harus gagal
      await expect(driver.printRaw(testBytes)).rejects.toThrow('Printer belum terhubung');
    });
  });
});
