-- ============================================================================
-- MIGRASI 006: PERBAIKAN RLS & IZIN AKSES SIMPAN PROFIL & KELOLA KASIR
-- Mengizinkan tablet POS dan aplikasi mobile mengelola kasir, profil toko/pemilik,
-- serta mengunggah/mengubah foto avatar pada Supabase Storage (bucket avatars).
-- ============================================================================

-- 1. Tambah kolom pendukung profil kasir dan pemilik jika belum ada
alter table public.cashiers
  add column if not exists avatar_url text;

alter table public.shops
  add column if not exists owner_name text default 'Hartati Jahri',
  add column if not exists owner_avatar_url text;

-- 2. Berikan izin penggunaan tabel dan fungsi kepada anon dan authenticated
grant select, insert, update, delete on public.cashiers to anon, authenticated;
grant select, update on public.shops to anon, authenticated;

-- ============================================================================
-- 3. Kebijakan RLS (Row Level Security) untuk Tabel public.cashiers
-- ============================================================================

-- Pastikan RLS aktif pada tabel cashiers
alter table public.cashiers enable row level security;

-- Izinkan baca seluruh kasir aktif
drop policy if exists "Anon & auth: baca cashiers" on public.cashiers;
create policy "Anon & auth: baca cashiers"
  on public.cashiers for select
  to anon, authenticated
  using (true);

-- Izinkan tambah kasir baru dari tablet / hp / web
drop policy if exists "Anon & auth: tambah cashiers" on public.cashiers;
drop policy if exists "Hanya owner yang dapat menambah atau mengubah kasir" on public.cashiers;
create policy "Anon & auth: tambah cashiers"
  on public.cashiers for insert
  to anon, authenticated
  with check (true);

-- Izinkan perbarui kasir (nama, status active, avatar_url)
drop policy if exists "Anon & auth: ubah cashiers" on public.cashiers;
create policy "Anon & auth: ubah cashiers"
  on public.cashiers for update
  to anon, authenticated
  using (true)
  with check (true);

-- Izinkan hapus kasir
drop policy if exists "Anon & auth: hapus cashiers" on public.cashiers;
create policy "Anon & auth: hapus cashiers"
  on public.cashiers for delete
  to anon, authenticated
  using (true);

-- ============================================================================
-- 4. Kebijakan RLS (Row Level Security) untuk Tabel public.shops (Profil Toko)
-- ============================================================================

-- Izinkan perbarui profil toko (nama, telepon, alamat, bank, owner_avatar_url)
drop policy if exists "Anon & auth: ubah shops" on public.shops;
drop policy if exists "Hanya owner yang dapat mengubah informasi toko" on public.shops;
create policy "Anon & auth: ubah shops"
  on public.shops for update
  to anon, authenticated
  using (true)
  with check (true);

-- ============================================================================
-- 5. RPC Security Definer: Kelola Kasir & Profil Toko (Aman untuk POS Anon)
-- ============================================================================

-- RPC Tambah Kasir
create or replace function public.add_cashier(
  p_shop_id uuid,
  p_name text
)
returns public.cashiers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.cashiers;
  v_target_shop uuid;
begin
  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Nama kasir tidak boleh kosong.';
  end if;

  v_target_shop := coalesce(p_shop_id, '40f91c30-2e23-476b-bdd7-5e0605b1f812'::uuid, '00000000-0000-0000-0000-000000000001'::uuid);

  insert into public.cashiers (shop_id, name, active)
  values (v_target_shop, trim(p_name), true)
  returning * into v_result;

  return v_result;
end;
$$;

-- RPC Nonaktifkan / Hapus Kasir
create or replace function public.remove_cashier(
  p_cashier_id uuid
)
returns public.cashiers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.cashiers;
begin
  update public.cashiers
  set active = false
  where id = p_cashier_id
  returning * into v_result;

  return v_result;
end;
$$;

-- RPC Perbarui Profil Toko & Pemilik
create or replace function public.update_shop_profile(
  p_shop_id uuid,
  p_name text default null,
  p_phone_no text default null,
  p_address text default null,
  p_bank_name text default null,
  p_bank_account text default null,
  p_bank_account_holder text default null,
  p_owner_name text default null,
  p_owner_avatar_url text default null
)
returns public.shops
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.shops;
begin
  update public.shops
  set
    name = coalesce(p_name, name),
    phone_no = coalesce(p_phone_no, phone_no),
    address = coalesce(p_address, address),
    bank_name = coalesce(p_bank_name, bank_name),
    bank_account = coalesce(p_bank_account, bank_account),
    bank_account_holder = coalesce(p_bank_account_holder, bank_account_holder),
    owner_name = coalesce(p_owner_name, owner_name),
    owner_avatar_url = coalesce(p_owner_avatar_url, owner_avatar_url)
  where id = p_shop_id
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.add_cashier(uuid, text) to anon, authenticated;
grant execute on function public.remove_cashier(uuid) to anon, authenticated;
grant execute on function public.update_shop_profile(uuid, text, text, text, text, text, text, text, text) to anon, authenticated;

-- ============================================================================
-- 6. Supabase Storage: Bucket Avatars & Kebijakan RLS storage.objects
-- ============================================================================

-- Pastikan bucket 'avatars' sudah terdaftar dan bersifat public
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Catatan: RLS pada storage.objects sudah aktif secara bawaan (default) oleh Supabase.
-- Jangan menjalankan 'alter table storage.objects enable row level security;' karena tabel ini
-- dimiliki oleh supabase_storage_admin sehingga akan memicu error 42501 (must be owner of table objects).

-- Izinkan anon dan authenticated membaca semua berkas avatar publik
drop policy if exists "Anon & auth: baca avatars" on storage.objects;
create policy "Anon & auth: baca avatars"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- Izinkan anon dan authenticated mengunggah foto profil / avatar
drop policy if exists "Anon & auth: upload avatars" on storage.objects;
create policy "Anon & auth: upload avatars"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'avatars');

-- Izinkan anon dan authenticated menimpa (upsert) foto profil / avatar
drop policy if exists "Anon & auth: ubah avatars" on storage.objects;
create policy "Anon & auth: ubah avatars"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

-- Izinkan anon dan authenticated menghapus foto profil / avatar
drop policy if exists "Anon & auth: hapus avatars" on storage.objects;
create policy "Anon & auth: hapus avatars"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'avatars');
