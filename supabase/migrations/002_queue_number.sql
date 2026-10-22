-- ============================================================================
-- MIGRASI 002: SISTEM NOMOR ANTRIAN PER TOKO & TANGGAL BISNIS (ATOMIC & IDEMPOTENT)
-- ============================================================================

-- 1. Tambah pengaturan jam reset antrian pada tabel shops (default: 00:00 tengah malam)
alter table public.shops
add column if not exists queue_reset_time time not null default '00:00';

-- 2. Tambah kolom queue_no dan business_date pada tabel orders
alter table public.orders
add column if not exists queue_no int;

alter table public.orders
add column if not exists business_date date;

-- 3. Buat tabel counter antrian atomik per toko dan tanggal bisnis
create table if not exists public.shop_queue_counters (
  shop_id uuid not null references public.shops(id) on delete cascade,
  business_date date not null,
  current_number int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (shop_id, business_date)
);

-- RLS untuk tabel counter: hanya dapat dibaca oleh anggota toko, mutasi hanya lewat RPC definer
alter table public.shop_queue_counters enable row level security;

drop policy if exists "Shop queue counters: dapat dibaca anggota" on public.shop_queue_counters;
create policy "Shop queue counters: dapat dibaca anggota"
  on public.shop_queue_counters for select
  using (public.is_member(shop_id));

-- 4. Backfill data order yang sudah ada (berdasarkan urutan created_at per tanggal toko)
do $$
declare
  r record;
  v_prev_shop uuid := null;
  v_prev_date date := null;
  v_counter int := 0;
begin
  for r in
    select o.id, o.shop_id, (o.created_at at time zone coalesce(s.timezone, 'Asia/Makassar'))::date as b_date
    from public.orders o
    left join public.shops s on s.id = o.shop_id
    where o.queue_no is null
    order by o.shop_id, b_date, o.created_at asc
  loop
    if v_prev_shop is distinct from r.shop_id or v_prev_date is distinct from r.b_date then
      v_prev_shop := r.shop_id;
      v_prev_date := r.b_date;
      v_counter := 1;
    else
      v_counter := v_counter + 1;
    end if;

    update public.orders
    set queue_no = v_counter, business_date = r.b_date
    where id = r.id;

    insert into public.shop_queue_counters (shop_id, business_date, current_number, updated_at)
    values (r.shop_id, r.b_date, v_counter, now())
    on conflict (shop_id, business_date)
    do update set current_number = greatest(public.shop_queue_counters.current_number, v_counter);
  end loop;
end $$;

-- 5. Indeks unik: menjamin tidak ada nomor antrian kembar pada toko dan tanggal bisnis yang sama
create unique index if not exists idx_orders_shop_bdate_queue
on public.orders (shop_id, business_date, queue_no);

-- 6. Perbarui RPC create_order dengan nomor antrian atomik & penentuan tanggal bisnis toko
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

  -- Variabel tanggal bisnis dan antrian
  v_shop_tz text;
  v_reset_time time;
  v_now_shop timestamp;
  v_business_date date;
  v_queue_no int;
begin
  v_id := (p_order->>'id')::uuid;
  v_shop_id := (p_order->>'shop_id')::uuid;
  v_cashier_id := (p_order->>'cashier_id')::uuid;
  v_device_id := nullif(p_order->>'device_id', '')::uuid;
  v_table_no := trim(coalesce(p_order->>'table_no', ''));
  v_cash_received := (p_order->>'cash_received_idr')::int;

  -- 1. Verifikasi hak akses anggota toko
  if not public.is_member(v_shop_id) then
    raise exception 'Akses ditolak: bukan anggota toko.';
  end if;

  -- 2. Idempotensi: jika order id sudah ada, kembalikan data pesanan yang sudah tercatat
  select * into v_existing from public.orders where id = v_id;
  if found then
    return v_existing;
  end if;

  if v_table_no = '' then
    raise exception 'Nomor meja tidak boleh kosong.';
  end if;

  -- 3. Hitung tanggal bisnis berdasarkan zona waktu dan jam reset toko
  select timezone, queue_reset_time
  into v_shop_tz, v_reset_time
  from public.shops
  where id = v_shop_id;

  v_shop_tz := coalesce(v_shop_tz, 'Asia/Makassar');
  v_reset_time := coalesce(v_reset_time, '00:00'::time);

  -- Hitung waktu lokal saat ini pada toko
  v_now_shop := (now() at time zone v_shop_tz);

  if (v_now_shop::time) < v_reset_time then
    v_business_date := (v_now_shop - interval '1 day')::date;
  else
    v_business_date := v_now_shop::date;
  end if;

  -- 4. Hitung total harga server-side dari menu_items
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

  -- 5. Validasi pembayaran tunai
  if v_cash_received < v_total then
    raise exception 'Uang yang diterima kurang dari total pembayaran. Total: %, Diterima: %', v_total, v_cash_received;
  end if;

  v_change := v_cash_received - v_total;

  -- 6. Alokasi nomor antrian atomik (bebas race condition)
  insert into public.shop_queue_counters (shop_id, business_date, current_number, updated_at)
  values (v_shop_id, v_business_date, 1, now())
  on conflict (shop_id, business_date)
  do update set
    current_number = public.shop_queue_counters.current_number + 1,
    updated_at = now()
  returning current_number into v_queue_no;

  -- 7. Masukkan transaksi ke tabel orders
  insert into public.orders (
    id, shop_id, cashier_id, device_id, table_no, total_idr, cash_received_idr, change_idr, status, queue_no, business_date
  ) values (
    v_id, v_shop_id, v_cashier_id, v_device_id, v_table_no, v_total, v_cash_received, v_change, 'paid', v_queue_no, v_business_date
  ) returning * into v_created_order;

  -- 8. Masukkan rincian ke order_items dengan snapshot nama dan harga saat transaksi
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
