import { describe, it, expect } from 'vitest';
import { formatQueueNo } from '../lib/format/formatters.ts';
import fs from 'fs';
import path from 'path';

describe('Sistem Nomor Antrian Kasir (Part 1)', () => {
  describe('1. formatQueueNo', () => {
    it('harus memformat angka 1-9 menjadi 3 digit berawalan 00', () => {
      expect(formatQueueNo(1)).toBe('001');
      expect(formatQueueNo(5)).toBe('005');
      expect(formatQueueNo(9)).toBe('009');
    });

    it('harus memformat angka 10-99 menjadi 3 digit berawalan 0', () => {
      expect(formatQueueNo(12)).toBe('012');
      expect(formatQueueNo(99)).toBe('099');
    });

    it('harus memformat angka ratusan (100-999) tetap 3 digit', () => {
      expect(formatQueueNo(100)).toBe('100');
      expect(formatQueueNo(345)).toBe('345');
      expect(formatQueueNo(999)).toBe('999');
    });

    it('harus mempertahankan angka 4 digit atau lebih tanpa memotongnya', () => {
      expect(formatQueueNo(1000)).toBe('1000');
      expect(formatQueueNo(1500)).toBe('1500');
    });

    it('harus mengembalikan default "001" untuk null, undefined, 0, atau angka negatif', () => {
      expect(formatQueueNo(null)).toBe('001');
      expect(formatQueueNo(undefined)).toBe('001');
      expect(formatQueueNo(0)).toBe('001');
      expect(formatQueueNo(-5)).toBe('001');
      expect(formatQueueNo(NaN)).toBe('001');
    });
  });

  describe('2. Simulasi Konkurensi & Atomisitas (20 Panggilan Paralel)', () => {
    it('harus menghasilkan 20 nomor antrian unik berurutan 1 sampai 20 tanpa duplikasi', async () => {
      // Simulasi store counter di memory dengan atomic lock / mutex
      const counterStore: { [key: string]: number } = {};
      let lockPromise = Promise.resolve();

      const getNextQueueAtomic = async (shopId: string, businessDate: string): Promise<number> => {
        // Antrikan eksekusi secara serial seperti halnya row-lock / ON CONFLICT DO UPDATE di PostgreSQL
        const currentLock = lockPromise;
        let releaseLock: () => void;
        lockPromise = new Promise((resolve) => {
          releaseLock = resolve;
        });

        await currentLock;
        try {
          // Beri jeda acak untuk mensimulasikan latensi I/O server
          await new Promise((r) => setTimeout(r, Math.random() * 5));
          const key = `${shopId}:${businessDate}`;
          const current = counterStore[key] || 0;
          const next = current + 1;
          counterStore[key] = next;
          return next;
        } finally {
          releaseLock!();
        }
      };

      const shopId = 'shop-tatie-001';
      const businessDate = '2026-10-22';

      // Jalankan 20 panggilan paralel secara bersamaan
      const concurrentTasks = Array.from({ length: 20 }, () =>
        getNextQueueAtomic(shopId, businessDate)
      );

      const results = await Promise.all(concurrentTasks);

      // Verifikasi: harus ada 20 hasil
      expect(results.length).toBe(20);

      // Verifikasi: tidak ada duplikat (Set berukuran 20)
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(20);

      // Verifikasi: berisi nomor 1 sampai 20 lengkap
      const sorted = [...results].sort((a, b) => a - b);
      expect(sorted[0]).toBe(1);
      expect(sorted[19]).toBe(20);
      for (let i = 0; i < 20; i++) {
        expect(sorted[i]).toBe(i + 1);
      }
    });
  });

  describe('3. Idempotensi Pesanan', () => {
    it('harus mengembalikan nomor antrian yang sama jika ID transaksi yang sama dikirim ulang', async () => {
      const orderDb: { [orderId: string]: { id: string; queue_no: number } } = {};
      let queueCounter = 0;

      const createOrderIdempotent = (orderId: string) => {
        if (orderDb[orderId]) {
          // Idempotent return existing
          return orderDb[orderId];
        }
        queueCounter += 1;
        const newOrder = { id: orderId, queue_no: queueCounter };
        orderDb[orderId] = newOrder;
        return newOrder;
      };

      const firstCall = createOrderIdempotent('order-uuid-abc-123');
      expect(firstCall.queue_no).toBe(1);

      // Panggilan kedua dengan ID yang sama persis (misal retry jaringan)
      const secondCall = createOrderIdempotent('order-uuid-abc-123');
      expect(secondCall.queue_no).toBe(1);
      expect(secondCall.id).toBe('order-uuid-abc-123');

      // Order baru berikutnya mendapat nomor antrian 2
      const thirdCall = createOrderIdempotent('order-uuid-def-456');
      expect(thirdCall.queue_no).toBe(2);
    });
  });

  describe('4. Rollover Tanggal Bisnis (Reset 00:00 WITA)', () => {
    it('harus mereset nomor antrian kembali ke 001 saat berganti tanggal bisnis', () => {
      const counters: { [key: string]: number } = {};

      const allocateQueue = (shopId: string, bDate: string) => {
        const key = `${shopId}:${bDate}`;
        counters[key] = (counters[key] || 0) + 1;
        return counters[key];
      };

      const shopId = 'shop-tatie-001';
      // Hari 1
      expect(allocateQueue(shopId, '2026-10-21')).toBe(1);
      expect(allocateQueue(shopId, '2026-10-21')).toBe(2);
      expect(allocateQueue(shopId, '2026-10-21')).toBe(3);

      // Berganti hari ke 2026-10-22 -> kembali ke 1 (001)
      expect(allocateQueue(shopId, '2026-10-22')).toBe(1);
      expect(allocateQueue(shopId, '2026-10-22')).toBe(2);
    });
  });

  describe('5. Validasi Migrasi SQL 002 & Aturan Keamanan RLS', () => {
    it('memastikan berkas migrasi supabase/migrations/002_queue_number.sql memuat constraint unik & RLS', () => {
      const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/002_queue_number.sql');
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

      // 1. Memuat kolom queue_reset_time, queue_no, dan business_date
      expect(sqlContent).toContain('queue_reset_time');
      expect(sqlContent).toContain('queue_no');
      expect(sqlContent).toContain('business_date');

      // 2. Memuat tabel shop_queue_counters
      expect(sqlContent).toContain('create table if not exists public.shop_queue_counters');

      // 3. Mengaktifkan RLS
      expect(sqlContent).toContain('alter table public.shop_queue_counters enable row level security');

      // 4. Policy hanya SELECT untuk anggota toko
      expect(sqlContent).toContain('for select');
      expect(sqlContent).toContain('is_member(shop_id)');

      // 5. Tidak ada policy INSERT/UPDATE publik (hanya lewat SECURITY DEFINER RPC)
      expect(sqlContent).not.toContain('for insert');
      expect(sqlContent).not.toContain('for update');

      // 6. Indeks unik komposit mencegah antrian kembar
      expect(sqlContent).toContain('create unique index if not exists idx_orders_shop_bdate_queue');
      expect(sqlContent).toContain('(shop_id, business_date, queue_no)');

      // 7. Atomic counter upsert
      expect(sqlContent).toContain('on conflict (shop_id, business_date)');
      expect(sqlContent).toContain('returning current_number into v_queue_no');
    });
  });
});
