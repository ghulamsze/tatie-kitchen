-- ============================================================================
-- MIGRASI 004: STUB RPC UNTUK LAPTOP ADMIN BACKOFFICE (PHASE 6d)
-- Sesuai docs/NEXT_MASTER_PROMPT.txt Fase 6d
-- ============================================================================

-- 1. Stub RPC: Laporan Penjualan (Sales Report)
create or replace function public.get_sales_report(
  p_shop_id uuid,
  p_start_date date,
  p_end_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Memastikan pemanggil adalah owner toko
  if not exists (
    select 1 from public.shop_members
    where shop_id = p_shop_id
      and user_id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'Akses ditolak: hanya owner yang berhak melihat laporan penjualan';
  end if;

  -- Stub placeholder: implementasi komputasi agregasi penuh pada fase laptop
  return jsonb_build_object(
    'status', 'stub',
    'message', 'Fungsi get_sales_report dipersiapkan untuk fase Laptop Admin Web',
    'shop_id', p_shop_id,
    'start_date', p_start_date,
    'end_date', p_end_date
  );
end;
$$;

-- 2. Stub RPC: Update Item Menu (Nama, Harga, Foto)
create or replace function public.update_menu_item(
  p_item_id uuid,
  p_name text,
  p_price_idr int,
  p_photo_path text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
begin
  select shop_id into v_shop_id from public.menu_items where id = p_item_id;

  if v_shop_id is null then
    raise exception 'Item menu tidak ditemukan';
  end if;

  if not exists (
    select 1 from public.shop_members
    where shop_id = v_shop_id
      and user_id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'Akses ditolak: perangkat tablet/kasir tidak berhak mengubah harga menu';
  end if;

  update public.menu_items
  set
    name = coalesce(p_name, name),
    price_idr = coalesce(p_price_idr, price_idr),
    photo_path = coalesce(p_photo_path, photo_path)
  where id = p_item_id;

  return jsonb_build_object('success', true, 'item_id', p_item_id);
end;
$$;

-- 3. Stub RPC: Deaktivasi Kasir (Nonaktifkan Kasir)
create or replace function public.deactivate_cashier(
  p_cashier_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
begin
  select shop_id into v_shop_id from public.cashiers where id = p_cashier_id;

  if v_shop_id is null then
    raise exception 'Profil kasir tidak ditemukan';
  end if;

  if not exists (
    select 1 from public.shop_members
    where shop_id = v_shop_id
      and user_id = auth.uid()
      and role = 'owner'
  ) then
    raise exception 'Akses ditolak: hanya owner yang dapat menonaktifkan kasir';
  end if;

  update public.cashiers
  set active = false
  where id = p_cashier_id;

  return jsonb_build_object('success', true, 'cashier_id', p_cashier_id);
end;
$$;
