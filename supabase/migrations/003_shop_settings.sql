-- ============================================================================
-- MIGRASI 003: PENGATURAN TOKO (SHOP SETTINGS & PAYMENT PROFILES)
-- Sesuai docs/NEXT_MASTER_PROMPT.txt Fase 6a & arsitektur.md
-- ============================================================================

-- 1. Tambahkan kolom pengaturan profil & rekening ke tabel public.shops
alter table public.shops
  add column if not exists phone_no text default '0812-3456-7890',
  add column if not exists address text default 'Jl. Tamalate 2 No. 8, Makassar',
  add column if not exists bank_name text default 'Bank Kaltimtara',
  add column if not exists bank_account text default '1747037252',
  add column if not exists bank_account_holder text default 'Hartati Jahri',
  add column if not exists qris_path text default '/assets/images/qris-clean.png';

-- 2. Kebijakan RLS (Row Level Security) untuk tabel public.shops
-- Semua anggota toko (role 'device' maupun 'owner') dapat membaca profil toko
create policy "Anggota toko dapat membaca profil toko"
  on public.shops for select
  using (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.shop_members sm
      where sm.shop_id = shops.id
        and sm.user_id = auth.uid()
    )
    or auth.role() = 'anon' -- Diizinkan untuk tablet offline/kiosk POS beta
  );

-- Hanya pemilik (role 'owner') yang dapat mengubah informasi toko
create policy "Hanya owner yang dapat mengubah informasi toko"
  on public.shops for update
  using (
    exists (
      select 1 from public.shop_members sm
      where sm.shop_id = shops.id
        and sm.user_id = auth.uid()
        and sm.role = 'owner'
    )
  );
