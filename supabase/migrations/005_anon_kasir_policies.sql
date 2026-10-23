-- ============================================================================
-- MIGRASI 005: DUKUNGAN AKSES ANOMIM / KASIR POS TABLET & WEB
-- Mengizinkan tablet POS dan web kasir membaca menu, kasir, toko, dan mencatat transaksi order
-- ============================================================================

-- 1. Berikan hak akses skema, tabel, dan fungsi untuk role anon dan authenticated
grant usage on schema public to anon, authenticated;
grant select on public.shops to anon, authenticated;
grant select on public.cashiers to anon, authenticated;
grant select on public.menu_groups to anon, authenticated;
grant select on public.menu_items to anon, authenticated;
grant select, insert on public.orders to anon, authenticated;
grant select, insert on public.order_items to anon, authenticated;
grant select, insert, update on public.shop_queue_counters to anon, authenticated;
grant execute on function public.create_order(jsonb) to anon, authenticated;
grant execute on function public.set_item_availability(uuid, boolean) to anon, authenticated;
grant execute on function public.add_cashier(uuid, text) to anon, authenticated;

-- 2. Kebijakan RLS (Row Level Security) untuk anon & authenticated
-- Izinkan kasir membaca data toko
drop policy if exists "Anon & auth: baca shops" on public.shops;
create policy "Anon & auth: baca shops"
  on public.shops for select
  to anon, authenticated
  using (true);

-- Izinkan kasir membaca data profil kasir aktif
drop policy if exists "Anon & auth: baca cashiers" on public.cashiers;
create policy "Anon & auth: baca cashiers"
  on public.cashiers for select
  to anon, authenticated
  using (true);

-- Izinkan kasir membaca kelompok menu
drop policy if exists "Anon & auth: baca menu_groups" on public.menu_groups;
create policy "Anon & auth: baca menu_groups"
  on public.menu_groups for select
  to anon, authenticated
  using (true);

-- Izinkan kasir membaca item menu
drop policy if exists "Anon & auth: baca menu_items" on public.menu_items;
create policy "Anon & auth: baca menu_items"
  on public.menu_items for select
  to anon, authenticated
  using (true);

-- Izinkan kasir membaca transaksi pesanan
drop policy if exists "Anon & auth: baca orders" on public.orders;
create policy "Anon & auth: baca orders"
  on public.orders for select
  to anon, authenticated
  using (true);

-- Izinkan kasir memasukkan transaksi pesanan baru
drop policy if exists "Anon & auth: buat orders" on public.orders;
create policy "Anon & auth: buat orders"
  on public.orders for insert
  to anon, authenticated
  with check (true);

-- Izinkan kasir membaca rincian item pesanan
drop policy if exists "Anon & auth: baca order_items" on public.order_items;
create policy "Anon & auth: baca order_items"
  on public.order_items for select
  to anon, authenticated
  using (true);

-- Izinkan kasir memasukkan rincian item pesanan baru
drop policy if exists "Anon & auth: buat order_items" on public.order_items;
create policy "Anon & auth: buat order_items"
  on public.order_items for insert
  to anon, authenticated
  with check (true);

-- Izinkan akses counter antrian
alter table public.shop_queue_counters enable row level security;
drop policy if exists "Anon & auth: kelola antrian" on public.shop_queue_counters;
create policy "Anon & auth: kelola antrian"
  on public.shop_queue_counters for all
  to anon, authenticated
  using (true)
  with check (true);

-- 3. Pastikan record default Toko dan Kasir ada di database jika tabel kosong
insert into public.shops (id, name, timezone)
values ('00000000-0000-0000-0000-000000000001'::uuid, 'Tati''e Kitchen', 'Asia/Makassar')
on conflict (id) do nothing;

insert into public.cashiers (id, shop_id, name, active)
values
  ('00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Robertus Amaresi', true),
  ('00000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Puspitawati', true)
on conflict (id) do nothing;

-- 4. Perbarui RPC create_order agar mendukung pemanggilan dari kasir POS tanpa sesi auth JWT
create or replace function public.create_order(p_order jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_shop_id uuid;
  v_cashier_id uuid;
  v_device_id uuid;
  v_table_no text;
  v_cash_received int;
  v_total int := 0;
  v_change int;
  v_existing public.orders;
  v_item record;
  v_created_order public.orders;

  -- Variabel tanggal bisnis dan antrian
  v_shop_tz text;
  v_reset_time time;
  v_now_shop timestamp;
  v_business_date date;
  v_queue_no int;
begin
  v_id := coalesce(nullif(p_order->>'id', '')::uuid, gen_random_uuid());
  
  -- Handle shop_id fallback
  begin
    v_shop_id := (p_order->>'shop_id')::uuid;
  exception when others then
    select id into v_shop_id from public.shops limit 1;
    if v_shop_id is null then
      v_shop_id := '00000000-0000-0000-0000-000000000001'::uuid;
      insert into public.shops (id, name, timezone)
      values (v_shop_id, 'Tati''e Kitchen', 'Asia/Makassar')
      on conflict (id) do nothing;
    end if;
  end;

  -- Handle cashier_id fallback
  begin
    v_cashier_id := (p_order->>'cashier_id')::uuid;
  exception when others then
    select id into v_cashier_id from public.cashiers where shop_id = v_shop_id and active = true limit 1;
    if v_cashier_id is null then
      v_cashier_id := '00000000-0000-0000-0000-000000000002'::uuid;
      insert into public.cashiers (id, shop_id, name, active)
      values (v_cashier_id, v_shop_id, 'Kasir Utama', true)
      on conflict (id) do nothing;
    end if;
  end;

  v_device_id := nullif(p_order->>'device_id', '')::uuid;
  v_table_no := trim(coalesce(p_order->>'table_no', ''));
  v_cash_received := (p_order->>'cash_received_idr')::int;

  -- Idempotensi
  select * into v_existing from public.orders where id = v_id;
  if found then
    return v_existing;
  end if;

  if v_table_no = '' then
    v_table_no := '01';
  end if;

  -- Tanggal bisnis
  select timezone, queue_reset_time
  into v_shop_tz, v_reset_time
  from public.shops
  where id = v_shop_id;

  v_shop_tz := coalesce(v_shop_tz, 'Asia/Makassar');
  v_reset_time := coalesce(v_reset_time, '00:00'::time);
  v_now_shop := (now() at time zone v_shop_tz);

  if (v_now_shop::time) < v_reset_time then
    v_business_date := (v_now_shop - interval '1 day')::date;
  else
    v_business_date := v_now_shop::date;
  end if;

  -- Hitung total dari snapshot atau fallback
  for v_item in select * from jsonb_to_recordset(p_order->'items') as x(menu_item_id text, qty int, price_snapshot_idr int, name_snapshot text) loop
    if v_item.qty <= 0 then
      v_item.qty := 1;
    end if;
    v_total := v_total + (coalesce(v_item.price_snapshot_idr, 25000) * v_item.qty);
  end loop;

  if v_cash_received is null or v_cash_received < v_total then
    v_cash_received := v_total;
  end if;
  v_change := v_cash_received - v_total;

  -- Alokasi nomor antrian atomik
  insert into public.shop_queue_counters (shop_id, business_date, current_number, updated_at)
  values (v_shop_id, v_business_date, 1, now())
  on conflict (shop_id, business_date)
  do update set
    current_number = public.shop_queue_counters.current_number + 1,
    updated_at = now()
  returning current_number into v_queue_no;

  -- Insert order
  insert into public.orders (
    id, shop_id, cashier_id, device_id, table_no, total_idr, cash_received_idr, change_idr, status, queue_no, business_date
  ) values (
    v_id, v_shop_id, v_cashier_id, v_device_id, v_table_no, v_total, v_cash_received, v_change, 'paid', v_queue_no, v_business_date
  ) returning * into v_created_order;

  -- Insert order items
  for v_item in select * from jsonb_to_recordset(p_order->'items') as x(menu_item_id text, qty int, price_snapshot_idr int, name_snapshot text) loop
    insert into public.order_items (
      order_id, name_snapshot, price_snapshot_idr, qty
    ) values (
      v_id,
      coalesce(v_item.name_snapshot, 'Item Menu'),
      coalesce(v_item.price_snapshot_idr, 25000),
      v_item.qty
    );
  end loop;

  return v_created_order;
end;
$$;
