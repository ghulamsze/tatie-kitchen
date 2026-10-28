-- ============================================================================
-- MIGRASI 010: HAPUS TRIGGER BATAS 7 ITEM & PERBAIKAN ADD MENU ITEM
-- ============================================================================

-- 1. Hapus trigger dan fungsi pembatas 7 item aktif per kelompok
drop trigger if exists trg_check_max_items_per_group on public.menu_items;
drop function if exists public.check_max_items_per_group();

-- 2. Pastikan kolom group_id bersifat nullable sehingga menu dapat ditambahkan tanpa kendala
alter table public.menu_items
  alter column group_id drop not null;

-- 3. Berikan izin lengkap CRUD pada menu_items dan menu_groups
grant select, insert, update, delete on public.menu_items to anon, authenticated;
grant select, insert, update, delete on public.menu_groups to anon, authenticated;

-- 4. Perbarui fungsi RPC add_menu_item agar aman dan tidak pernah gagal karena batasan kelompok
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

  -- Cari kelompok berdasarkan kategori yang cocok
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
