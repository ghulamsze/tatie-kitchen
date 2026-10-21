-- ============================================================================
-- SEED DATA TATI'E KITCHEN
-- Sesuai konstanta MG, TR, HB di reference/tati_e-kitchen-final-preview.html
-- Zona waktu: Asia/Makassar (WITA)
-- ============================================================================

do $$
declare
  v_shop_id uuid;
  v_group_id uuid;
begin
  -- 1. Toko Tati'e Kitchen di Makassar
  select id into v_shop_id from public.shops where name = 'Tati’e Kitchen' limit 1;
  if v_shop_id is null then
    insert into public.shops (name, timezone)
    values ('Tati’e Kitchen', 'Asia/Makassar')
    returning id into v_shop_id;
  end if;

  -- 2. Dua Kasir Contoh
  if not exists (select 1 from public.cashiers where shop_id = v_shop_id and name = 'Robertus Amaresi') then
    insert into public.cashiers (shop_id, name, active) values (v_shop_id, 'Robertus Amaresi', true);
  end if;

  if not exists (select 1 from public.cashiers where shop_id = v_shop_id and name = 'Puspitawati') then
    insert into public.cashiers (shop_id, name, active) values (v_shop_id, 'Puspitawati', true);
  end if;

  -- 3. Kategori: MAKANAN
  -- 3a. Nasi goreng
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'makanan', 'Nasi goreng', 'Nasi goreng', 1)
  on conflict (shop_id, name) do update set icon_key = 'Nasi goreng'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Nasi Goreng Telur', 20000, true, 'foto/nasi-goreng-telur.jpg', 1),
    (v_shop_id, v_group_id, 'Nasi Goreng Telur Ayam Suwir', 25000, true, 'foto/nasi-goreng-telur-ayam-suwir.jpg', 2),
    (v_shop_id, v_group_id, 'Nasi Goreng Ayam', 33000, true, 'foto/nasi-goreng-ayam.jpg', 3),
    (v_shop_id, v_group_id, 'Nasi Goreng Ayam Komplit', 38000, true, 'foto/nasi-goreng-ayam-komplit.jpg', 4),
    (v_shop_id, v_group_id, 'Nasi Goreng Mercon Telur', 25000, true, 'foto/nasi-goreng-mercon-telur.jpg', 5),
    (v_shop_id, v_group_id, 'Nasi Goreng Mercon Ayam', 35000, true, 'foto/nasi-goreng-mercon-ayam.jpg', 6),
    (v_shop_id, v_group_id, 'Nasi Goreng Mercon Komplit', 40000, true, 'foto/nasi-goreng-mercon-komplit.jpg', 7)
  on conflict do nothing;

  -- 3b. Nasi ayam
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'makanan', 'Nasi ayam', 'Nasi ayam', 2)
  on conflict (shop_id, name) do update set icon_key = 'Nasi ayam'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Nasi Ayam Geprek', 25000, true, 'foto/nasi-ayam-geprek.jpg', 1),
    (v_shop_id, v_group_id, 'Nasi Ayam Crispy', 25000, true, 'foto/nasi-ayam-crispy.jpg', 2),
    (v_shop_id, v_group_id, 'Nasi Ayam Crispy Lava', 30000, true, 'foto/nasi-ayam-crispy-lava.jpg', 3),
    (v_shop_id, v_group_id, 'Nasi Ayam Lalap', 35000, true, 'foto/nasi-ayam-lalap.jpg', 4),
    (v_shop_id, v_group_id, 'Nasi Ayam Penyet', 35000, true, 'foto/nasi-ayam-penyet.jpg', 5),
    (v_shop_id, v_group_id, 'Nasi Ayam Bakar', 35000, true, 'foto/nasi-ayam-bakar.jpg', 6)
  on conflict do nothing;

  -- 3c. Tradisional dan berkuah
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'makanan', 'Tradisional dan berkuah', 'Tradisional dan berkuah', 3)
  on conflict (shop_id, name) do update set icon_key = 'Tradisional dan berkuah'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Nasi Goreng Telur Tradisional', 25000, true, 'foto/nasi-goreng-telur-tradisional.jpg', 1),
    (v_shop_id, v_group_id, 'Nasi Goreng Ayam Tradisional', 35000, true, 'foto/nasi-goreng-ayam-tradisional.jpg', 2),
    (v_shop_id, v_group_id, 'Nasi Goreng Tradisional Komplit', 40000, true, 'foto/nasi-goreng-tradisional-komplit.jpg', 3),
    (v_shop_id, v_group_id, 'Soto Ayam', 25000, true, 'foto/soto-ayam.jpg', 4),
    (v_shop_id, v_group_id, 'Coto Makassar', 30000, true, 'foto/coto-makassar.jpg', 5)
  on conflict do nothing;

  -- 4. Kategori: MIE
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'mie', 'Mie', 'Mie', 4)
  on conflict (shop_id, name) do update set icon_key = 'Mie'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Mie Kuah', 30000, true, 'foto/mie-kuah.jpg', 1),
    (v_shop_id, v_group_id, 'Mie Goreng Telur', 25000, true, 'foto/mie-goreng-telur.jpg', 2),
    (v_shop_id, v_group_id, 'Mie Goreng Ayam', 35000, true, 'foto/mie-goreng-ayam.jpg', 3),
    (v_shop_id, v_group_id, 'Mie Goreng Komplit', 40000, true, 'foto/mie-goreng-komplit.jpg', 4),
    (v_shop_id, v_group_id, 'Mie Tek Tek', 30000, true, 'foto/mie-tek-tek.jpg', 5),
    (v_shop_id, v_group_id, 'Mie Goreng Tradisional', 25000, true, 'foto/mie-goreng-tradisional.jpg', 6),
    (v_shop_id, v_group_id, 'Indomie Goreng', 20000, true, 'foto/indomie-goreng.jpg', 7)
  on conflict do nothing;

  -- 5. Kategori: SNACK
  -- 5a. Camilan
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'snack', 'Camilan', 'Camilan', 5)
  on conflict (shop_id, name) do update set icon_key = 'Camilan'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Nugget', 15000, true, 'foto/nugget.jpg', 1),
    (v_shop_id, v_group_id, 'Lekor', 15000, true, 'foto/lekor.jpg', 2),
    (v_shop_id, v_group_id, 'Sosis Goreng', 15000, true, 'foto/sosis-goreng.jpg', 3),
    (v_shop_id, v_group_id, 'Platter', 25000, true, 'foto/platter.jpg', 4),
    (v_shop_id, v_group_id, 'Pisang Nugget Cokelat', 15000, true, 'foto/pisang-nugget-cokelat.jpg', 5),
    (v_shop_id, v_group_id, 'Pisang Nugget Keju', 15000, true, 'foto/pisang-nugget-keju.jpg', 6),
    (v_shop_id, v_group_id, 'Pisang Nugget Cokelat Keju', 18000, true, 'foto/pisang-nugget-cokelat-keju.jpg', 7)
  on conflict do nothing;

  -- 5b. Burger dan roti (Kebab HABIS sesuai konstanta HB)
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'snack', 'Burger dan roti', 'Burger dan roti', 6)
  on conflict (shop_id, name) do update set icon_key = 'Burger dan roti'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Burger Telur', 20000, true, 'foto/burger-telur.jpg', 1),
    (v_shop_id, v_group_id, 'Burger Daging', 20000, true, 'foto/burger-daging.jpg', 2),
    (v_shop_id, v_group_id, 'Burger Komplit', 25000, true, 'foto/burger-komplit.jpg', 3),
    (v_shop_id, v_group_id, 'Roti Bakar', 25000, true, 'foto/roti-bakar.jpg', 4),
    (v_shop_id, v_group_id, 'Roti Jhon', 30000, true, 'foto/roti-jhon.jpg', 5),
    (v_shop_id, v_group_id, 'Kebab', 30000, false, 'foto/kebab.jpg', 6) -- Status Habis
  on conflict do nothing;

  -- 6. Kategori: MINUMAN
  -- 6a. Kopi panas
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'minuman', 'Kopi panas', 'Kopi panas', 7)
  on conflict (shop_id, name) do update set icon_key = 'Kopi panas'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Kopi Hitam', 10000, true, 'foto/kopi-hitam.jpg', 1),
    (v_shop_id, v_group_id, 'Kopi Susu', 15000, true, 'foto/kopi-susu.jpg', 2),
    (v_shop_id, v_group_id, 'Americano', 15000, true, 'foto/americano.jpg', 3),
    (v_shop_id, v_group_id, 'Cappuccino', 15000, true, 'foto/cappuccino.jpg', 4)
  on conflict do nothing;

  -- 6b. Teh dan cokelat panas
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'minuman', 'Teh dan cokelat panas', 'Teh dan cokelat panas', 8)
  on conflict (shop_id, name) do update set icon_key = 'Teh dan cokelat panas'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Teh', 5000, true, 'foto/teh.jpg', 1),
    (v_shop_id, v_group_id, 'Teh Susu', 15000, true, 'foto/teh-susu.jpg', 2),
    (v_shop_id, v_group_id, 'Cokelat Ori', 15000, true, 'foto/cokelat-ori.jpg', 3),
    (v_shop_id, v_group_id, 'Milo', 15000, true, 'foto/milo.jpg', 4)
  on conflict do nothing;

  -- 6c. Es kopi
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'minuman', 'Es kopi', 'Es kopi', 9)
  on conflict (shop_id, name) do update set icon_key = 'Es kopi'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Americano', 10000, true, 'foto/americano-es.jpg', 1),
    (v_shop_id, v_group_id, 'Cappuccino', 15000, true, 'foto/cappuccino-es.jpg', 2),
    (v_shop_id, v_group_id, 'Mochachino', 15000, true, 'foto/mochachino.jpg', 3),
    (v_shop_id, v_group_id, 'Latte Coffee', 15000, true, 'foto/latte-coffee.jpg', 4),
    (v_shop_id, v_group_id, 'Kopi Susu', 15000, true, 'foto/kopi-susu-es.jpg', 5),
    (v_shop_id, v_group_id, 'Gula Aren Coffee', 15000, true, 'foto/gula-aren-coffee.jpg', 6),
    (v_shop_id, v_group_id, 'Butterscote Latte Coffee', 15000, true, 'foto/butterscote-latte-coffee.jpg', 7)
  on conflict do nothing;

  -- 6d. Es kopi rasa dan cream
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'minuman', 'Es kopi rasa dan cream', 'Es kopi rasa dan cream', 10)
  on conflict (shop_id, name) do update set icon_key = 'Es kopi rasa dan cream'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Tiramisu Coffee', 15000, true, 'foto/tiramisu-coffee.jpg', 1),
    (v_shop_id, v_group_id, 'Hazelnut Coffee', 15000, true, 'foto/hazelnut-coffee.jpg', 2),
    (v_shop_id, v_group_id, 'Vanila Coffee', 15000, true, 'foto/vanila-coffee.jpg', 3),
    (v_shop_id, v_group_id, 'Strawberry Coffee', 15000, true, 'foto/strawberry-coffee.jpg', 4),
    (v_shop_id, v_group_id, 'Gula Aren Coffee Cream', 20000, true, 'foto/gula-aren-coffee-cream.jpg', 5),
    (v_shop_id, v_group_id, 'Panda Coffee Cream', 20000, true, 'foto/panda-coffee-cream.jpg', 6),
    (v_shop_id, v_group_id, 'Melon Coffee Cream', 20000, true, 'foto/melon-coffee-cream.jpg', 7)
  on conflict do nothing;

  -- 6e. Teh dan segar
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'minuman', 'Teh dan segar', 'Teh dan segar', 11)
  on conflict (shop_id, name) do update set icon_key = 'Teh dan segar'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Es Teh', 5000, true, 'foto/es-teh.jpg', 1),
    (v_shop_id, v_group_id, 'Jeruk', 10000, true, 'foto/jeruk.jpg', 2),
    (v_shop_id, v_group_id, 'Lemon Tea', 10000, true, 'foto/lemon-tea.jpg', 3),
    (v_shop_id, v_group_id, 'Teh Tarik', 15000, true, 'foto/teh-tarik.jpg', 4),
    (v_shop_id, v_group_id, 'Thai Tea', 15000, true, 'foto/thai-tea.jpg', 5),
    (v_shop_id, v_group_id, 'Susu Pandan', 15000, true, 'foto/susu-pandan.jpg', 6)
  on conflict do nothing;

  -- 6f. Cokelat dan susu
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'minuman', 'Cokelat dan susu', 'Cokelat dan susu', 12)
  on conflict (shop_id, name) do update set icon_key = 'Cokelat dan susu'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Cokelat Ori', 15000, true, 'foto/cokelat-ori-es.jpg', 1),
    (v_shop_id, v_group_id, 'Cokelat Almond', 15000, true, 'foto/cokelat-almond.jpg', 2),
    (v_shop_id, v_group_id, 'Milo', 15000, true, 'foto/milo-es.jpg', 3),
    (v_shop_id, v_group_id, 'Cadburry', 15000, true, 'foto/cadburry.jpg', 4),
    (v_shop_id, v_group_id, 'Brown Sugar', 15000, true, 'foto/brown-sugar.jpg', 5),
    (v_shop_id, v_group_id, 'Butterscote Latte', 15000, true, 'foto/butterscote-latte.jpg', 6),
    (v_shop_id, v_group_id, 'Extrajoss Susu', 15000, true, 'foto/extrajoss-susu.jpg', 7)
  on conflict do nothing;

  -- 6g. Rasa lain
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'minuman', 'Rasa lain', 'Rasa lain', 13)
  on conflict (shop_id, name) do update set icon_key = 'Rasa lain'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Taro', 15000, true, 'foto/taro.jpg', 1),
    (v_shop_id, v_group_id, 'Strawberry', 15000, true, 'foto/strawberry.jpg', 2),
    (v_shop_id, v_group_id, 'Mangga Milky', 15000, true, 'foto/mangga-milky.jpg', 3),
    (v_shop_id, v_group_id, 'Red Velvet', 15000, true, 'foto/red-velvet.jpg', 4),
    (v_shop_id, v_group_id, 'Vanila', 15000, true, 'foto/vanila.jpg', 5)
  on conflict do nothing;

  -- 6h. Minuman spesial
  insert into public.menu_groups (shop_id, category, name, icon_key, sort)
  values (v_shop_id, 'minuman', 'Minuman spesial', 'Minuman spesial', 14)
  on conflict (shop_id, name) do update set icon_key = 'Minuman spesial'
  returning id into v_group_id;

  insert into public.menu_items (shop_id, group_id, name, price_idr, available, photo_path, sort)
  values
    (v_shop_id, v_group_id, 'Green Tea', 15000, true, 'foto/green-tea.jpg', 1),
    (v_shop_id, v_group_id, 'Matcha', 15000, true, 'foto/matcha.jpg', 2),
    (v_shop_id, v_group_id, 'Nestum', 15000, true, 'foto/nestum.jpg', 3),
    (v_shop_id, v_group_id, 'Mangga Squash', 15000, true, 'foto/mangga-squash.jpg', 4),
    (v_shop_id, v_group_id, 'Blue Curacao Squash', 15000, true, 'foto/blue-curacao-squash.jpg', 5),
    (v_shop_id, v_group_id, 'Strawberry Squash', 15000, true, 'foto/strawberry-squash.jpg', 6)
  on conflict do nothing;

end $$;
