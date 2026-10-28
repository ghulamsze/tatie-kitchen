-- ============================================================================
-- MIGRASI 007: RESET TRANSAKSI & NOMOR ANTRIAN
-- Menghapus seluruh riwayat pesanan (orders & order_items) serta mereset counter antrian
-- ============================================================================

-- 1. Hapus semua data rincian item transaksi
DELETE FROM public.order_items;

-- 2. Hapus semua data transaksi pesanan
DELETE FROM public.orders;

-- 3. Reset counter nomor antrian harian toko
DELETE FROM public.shop_queue_counters;
