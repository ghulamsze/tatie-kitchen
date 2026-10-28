-- ============================================================================
-- MIGRASI 009: DUKUNGAN CRUD & RLS UNTUK MENU_ITEMS & MENU_GROUPS
-- Mengizinkan tablet POS dan aplikasi companion mengelola menu (tambah, edit, hapus)
-- secara aman dengan penanganan tipe data UUID yang idempoten.
-- ============================================================================

-- 1. Jadikan group_id nullable pada public.menu_items agar menu kustom tidak terkendala foreign key
alter table public.menu_items
  alter column group_id drop not null;

-- 2. Berikan izin penggunaan tabel untuk role anon dan authenticated
grant select, insert, update, delete on public.menu_items to anon, authenticated;
grant select, insert, update, delete on public.menu_groups to anon, authenticated;

-- 3. Kebijakan RLS (Row Level Security) untuk tabel public.menu_items
alter table public.menu_items enable row level security;

-- Izinkan baca seluruh item menu
drop policy if exists "Anon & auth: baca menu_items" on public.menu_items;
create policy "Anon & auth: baca menu_items"
  on public.menu_items for select
  to anon, authenticated
  using (true);

-- Izinkan tambah menu baru
drop policy if exists "Anon & auth: tambah menu_items" on public.menu_items;
create policy "Anon & auth: tambah menu_items"
  on public.menu_items for insert
  to anon, authenticated
  with check (true);

-- Izinkan perbarui menu (nama, harga, foto, ketersediaan, active, sort)
drop policy if exists "Anon & auth: ubah status menu_items" on public.menu_items;
drop policy if exists "Anon & auth: perbarui menu_items" on public.menu_items;
create policy "Anon & auth: perbarui menu_items"
  on public.menu_items for update
  to anon, authenticated
  using (true)
  with check (true);

-- Izinkan hapus menu
drop policy if exists "Anon & auth: hapus menu_items" on public.menu_items;
create policy "Anon & auth: hapus menu_items"
  on public.menu_items for delete
  to anon, authenticated
  using (true);

-- 4. Kebijakan RLS (Row Level Security) untuk tabel public.menu_groups
alter table public.menu_groups enable row level security;

drop policy if exists "Anon & auth: kelola menu_groups" on public.menu_groups;
create policy "Anon & auth: kelola menu_groups"
  on public.menu_groups for all
  to anon, authenticated
  using (true)
  with check (true);

-- 5. Seed kelompok menu standar jika belum tersedia
insert into public.menu_groups (id, shop_id, category, name, icon_key, sort)
values
  ('00000000-0000-0000-0000-000000000010'::uuid, '40f91c30-2e23-476b-bdd7-5e0605b1f812'::uuid, 'makanan', 'Makanan', 'Makanan', 1),
  ('00000000-0000-0000-0000-000000000011'::uuid, '40f91c30-2e23-476b-bdd7-5e0605b1f812'::uuid, 'mie', 'Mie', 'Mie', 2),
  ('00000000-0000-0000-0000-000000000012'::uuid, '40f91c30-2e23-476b-bdd7-5e0605b1f812'::uuid, 'snack', 'Snack', 'Snack', 3),
  ('00000000-0000-0000-0000-000000000013'::uuid, '40f91c30-2e23-476b-bdd7-5e0605b1f812'::uuid, 'minuman', 'Minuman', 'Minuman', 4)
on conflict do nothing;

-- 6. RPC Definer: Tambah Menu Item (Aman untuk POS Anon)
create or replace function public.add_menu_item(
  p_name text,
  p_price_idr int,
  p_category text default 'makanan',
  p_photo_path text default null,
  p_available boolean default true,
  p_shop_id uuid default null
)
returns public.menu_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_group_id uuid;
  v_result public.menu_items;
begin
  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Nama menu tidak boleh kosong.';
  end if;

  v_shop_id := coalesce(p_shop_id, '40f91c30-2e23-476b-bdd7-5e0605b1f812'::uuid, '00000000-0000-0000-0000-000000000001'::uuid);

  -- Cari group_id berdasarkan kategori jika cocok
  select id into v_group_id
  from public.menu_groups
  where shop_id = v_shop_id
    and category = lower(trim(coalesce(p_category, 'makanan')))
  limit 1;

  insert into public.menu_items (
    id,
    shop_id,
    group_id,
    name,
    price_idr,
    available,
    photo_path,
    active,
    sort
  )
  values (
    gen_random_uuid(),
    v_shop_id,
    v_group_id,
    trim(p_name),
    greatest(0, coalesce(p_price_idr, 0)),
    coalesce(p_available, true),
    nullif(trim(p_photo_path), ''),
    true,
    99
  )
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.add_menu_item(text, int, text, text, boolean, uuid) to anon, authenticated;

