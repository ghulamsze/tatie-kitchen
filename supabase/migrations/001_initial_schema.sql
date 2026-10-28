-- ============================================================================
-- MIGRASI 001: SKEMA AWAL, RLS, DAN RPC TATI'E KITCHEN
-- Sesuai docs/arsitektur.md Bagian 4 & 5
-- ============================================================================

-- 1. TABEL SHOPS (Toko)
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Makassar',
  created_at timestamptz not null default now()
);

-- 2. TABEL SHOP_MEMBERS (Akun & Peran: owner / device)
do $$ begin
  create type public.member_role as enum ('owner', 'device');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null,
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

-- 3. TABEL CASHIERS (Profil Kasir Aktif)
create table if not exists public.cashiers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. TABEL MENU_GROUPS (Kelompok Menu)
create table if not exists public.menu_groups (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  category text not null check (category in ('makanan', 'mie', 'snack', 'minuman')),
  name text not null,
  icon_key text not null,
  sort int not null default 0,
  unique (shop_id, name)
);

-- 5. TABEL MENU_ITEMS (Item Menu)
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  group_id uuid not null references public.menu_groups(id) on delete cascade,
  name text not null,
  price_idr int not null check (price_idr >= 0),
  available boolean not null default true,
  photo_path text,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 6. TABEL ORDERS (Transaksi Pesanan - ID dibuat klien agar idempoten)
create table if not exists public.orders (
  id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  cashier_id uuid not null references public.cashiers(id),
  device_id uuid,
  table_no text not null,
  total_idr int not null check (total_idr >= 0),
  cash_received_idr int not null,
  change_idr int not null check (change_idr >= 0),
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

-- 7. TABEL ORDER_ITEMS (Rincian Pesanan)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name_snapshot text not null,
  price_snapshot_idr int not null,
  qty int not null check (qty > 0)
);

-- 8. TABEL DEVICES (Perangkat Kasir Terdaftar)
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text,
  platform text,
  form_factor text,
  user_agent text,
  last_seen_at timestamptz not null default now()
);

-- 9. VIEW BEST_SELLERS (Menu Terlaris 30 Hari Terakhir, maks 7)
create or replace view public.best_sellers with (security_invoker = true) as
  select oi.menu_item_id, sum(oi.qty) as qty
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.created_at > now() - interval '30 days'
  group by oi.menu_item_id
  order by qty desc
  limit 7;

-- ============================================================================
-- KEAMANAN: HELPER FUNCTIONS & ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Fungsi bantu verifikasi anggota toko
create or replace function public.is_member(p_shop_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1 from public.shop_members
    where shop_id = p_shop_id and user_id = auth.uid()
  );
$$;

-- Fungsi bantu verifikasi pemilik toko (owner)
create or replace function public.is_owner(p_shop_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1 from public.shop_members
    where shop_id = p_shop_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- AKTIFKAN RLS DI SEMUA TABEL
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.cashiers enable row level security;
alter table public.menu_groups enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.devices enable row level security;

-- POLICIES SHOPS
drop policy if exists "Shops: anggota toko dapat membaca" on public.shops;
create policy "Shops: anggota toko dapat membaca"
  on public.shops for select
  using (public.is_member(id));

-- POLICIES SHOP_MEMBERS
drop policy if exists "Shop members: dapat dibaca anggota" on public.shop_members;
create policy "Shop members: dapat dibaca anggota"
  on public.shop_members for select
  using (public.is_member(shop_id));

-- POLICIES CASHIERS
drop policy if exists "Cashiers: dapat dibaca anggota" on public.cashiers;
create policy "Cashiers: dapat dibaca anggota"
  on public.cashiers for select
  using (public.is_member(shop_id));

drop policy if exists "Cashiers: hanya owner yang bisa modifikasi langsung" on public.cashiers;
create policy "Cashiers: hanya owner yang bisa modifikasi langsung"
  on public.cashiers for all
  using (public.is_owner(shop_id));

-- POLICIES MENU_GROUPS
drop policy if exists "Menu groups: dapat dibaca anggota" on public.menu_groups;
create policy "Menu groups: dapat dibaca anggota"
  on public.menu_groups for select
  using (public.is_member(shop_id));

drop policy if exists "Menu groups: hanya owner yang bisa modifikasi langsung" on public.menu_groups;
create policy "Menu groups: hanya owner yang bisa modifikasi langsung"
  on public.menu_groups for all
  using (public.is_owner(shop_id));

-- POLICIES MENU_ITEMS
drop policy if exists "Menu items: dapat dibaca anggota" on public.menu_items;
create policy "Menu items: dapat dibaca anggota"
  on public.menu_items for select
  using (public.is_member(shop_id));

drop policy if exists "Menu items: hanya owner yang bisa ubah harga atau hapus" on public.menu_items;
create policy "Menu items: hanya owner yang bisa ubah harga atau hapus"
  on public.menu_items for all
  using (public.is_owner(shop_id));

-- POLICIES ORDERS
drop policy if exists "Orders: dapat dibaca anggota" on public.orders;
create policy "Orders: dapat dibaca anggota"
  on public.orders for select
  using (public.is_member(shop_id));

-- POLICIES ORDER_ITEMS
drop policy if exists "Order items: dapat dibaca anggota" on public.order_items;
create policy "Order items: dapat dibaca anggota"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and public.is_member(o.shop_id)
    )
  );

-- POLICIES DEVICES
drop policy if exists "Devices: dapat dibaca dan diperbarui anggota" on public.devices;
create policy "Devices: dapat dibaca dan diperbarui anggota"
  on public.devices for all
  using (public.is_member(shop_id));

-- ============================================================================
-- RPC: SET_ITEM_AVAILABILITY (Tandai Habis / Tersedia dari Tablet)
-- ============================================================================
create or replace function public.set_item_availability(
  p_item_id uuid,
  p_available boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
begin
  select shop_id into v_shop_id from public.menu_items where id = p_item_id;
  if not found then
    raise exception 'Item menu tidak ditemukan.';
  end if;

  if not public.is_member(v_shop_id) then
    raise exception 'Akses ditolak: bukan anggota toko.';
  end if;

  update public.menu_items
  set available = p_available
  where id = p_item_id;
end;
$$;

-- ============================================================================
-- RPC: ADD_CASHIER (Tambah Kasir Baru dari Tablet/Laptop)
-- ============================================================================
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
begin
  if not public.is_member(p_shop_id) then
    raise exception 'Akses ditolak: bukan anggota toko.';
  end if;

  if trim(p_name) = '' then
    raise exception 'Nama kasir tidak boleh kosong.';
  end if;

  insert into public.cashiers (shop_id, name, active)
  values (p_shop_id, trim(p_name), true)
  returning * into v_result;

  return v_result;
end;
$$;

-- ============================================================================
-- RPC: CREATE_ORDER (Buat Transaksi - Perhitungan Total Server-Side & Idempoten)
-- ============================================================================
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
  v_menu record;
  v_created_order public.orders;
begin
  v_id := (p_order->>'id')::uuid;
  v_shop_id := (p_order->>'shop_id')::uuid;
  v_cashier_id := (p_order->>'cashier_id')::uuid;
  v_device_id := nullif(p_order->>'device_id', '')::uuid;
  v_table_no := trim(coalesce(p_order->>'table_no', ''));
  v_cash_received := (p_order->>'cash_received_idr')::int;

  -- 1. Verifikasi hak akses
  if not public.is_member(v_shop_id) then
    raise exception 'Akses ditolak: bukan anggota toko.';
  end if;

  -- 2. Idempotensi: jika order id sudah ada, kembalikan yang sudah tercatat
  select * into v_existing from public.orders where id = v_id;
  if found then
    return v_existing;
  end if;

  if v_table_no = '' then
    raise exception 'Nomor meja tidak boleh kosong.';
  end if;

  -- 3. Hitung total harga server-side dari menu_items
  for v_item in select * from jsonb_to_recordset(p_order->'items') as x(menu_item_id uuid, qty int) loop
    if v_item.qty <= 0 then
      raise exception 'Kuantitas item harus lebih besar dari 0.';
    end if;

    select id, name, price_idr, active into v_menu
    from public.menu_items
    where id = v_item.menu_item_id and shop_id = v_shop_id;

    if not found or not v_menu.active then
      raise exception 'Item menu tidak valid atau tidak aktif: %', v_item.menu_item_id;
    end if;

    v_total := v_total + (v_menu.price_idr * v_item.qty);
  end loop;

  -- 4. Validasi pembayaran tunai
  if v_cash_received < v_total then
    raise exception 'Uang yang diterima kurang dari total pembayaran. Total: %, Diterima: %', v_total, v_cash_received;
  end if;

  v_change := v_cash_received - v_total;

  -- 5. Masukkan ke orders
  insert into public.orders (
    id, shop_id, cashier_id, device_id, table_no, total_idr, cash_received_idr, change_idr, status
  ) values (
    v_id, v_shop_id, v_cashier_id, v_device_id, v_table_no, v_total, v_cash_received, v_change, 'paid'
  ) returning * into v_created_order;

  -- 6. Masukkan rincian ke order_items dengan snapshot nama dan harga saat transaksi
  for v_item in select * from jsonb_to_recordset(p_order->'items') as x(menu_item_id uuid, qty int) loop
    select name, price_idr into v_menu
    from public.menu_items
    where id = v_item.menu_item_id;

    insert into public.order_items (
      order_id, menu_item_id, name_snapshot, price_snapshot_idr, qty
    ) values (
      v_id, v_item.menu_item_id, v_menu.name, v_menu.price_idr, v_item.qty
    );
  end loop;

  return v_created_order;
end;
$$;

-- ============================================================================
-- TRIGGER: MAKSIMAL 7 ITEM AKTIF PER KELOMPOK MENU
-- ============================================================================
create or replace function public.check_max_items_per_group()
returns trigger
language plpgsql
as $$
declare
  v_count int;
begin
  if new.active = true then
    select count(*) into v_count
    from public.menu_items
    where group_id = new.group_id
      and active = true
      and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

    if v_count >= 7 then
      raise exception 'Batas tercapai: Maksimal 7 item aktif per kelompok menu agar pembeli tidak bingung.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_max_items_per_group on public.menu_items;
create trigger trg_check_max_items_per_group
before insert or update on public.menu_items
for each row
execute function public.check_max_items_per_group();
