# arsitektur.md Tati’e Kitchen

Fase sekarang: tablet kasir (beta, disimulasikan di laptop). Urutan perangkat: tablet, laptop, Android, iOS. Satu basis kode, satu database.

## 1. Keputusan utama

| Hal | Keputusan | Alasan |
|---|---|---|
| Aplikasi | Web app: React + TypeScript (strict) + Vite | Satu kode untuk semua perangkat; HTML preview mudah dipindah |
| Gaya | CSS variables dari design.md (tanpa Tailwind) | Token harus identik dengan HTML referensi |
| State | Zustand (UI, keranjang), TanStack Query (data server) | Ringan, mudah diuji |
| Database dan auth | Supabase (Postgres, Auth, Storage, Realtime). Region Singapore | Terdekat dengan Makassar |
| Online | Web di-host di Vercel (alternatif Cloudflare Pages atau Netlify), HTTPS | Syarat aplikasi berjalan online |
| APK tablet dan Android | Capacitor membungkus hasil build web | Satu kode; APK didapat lewat Android Studio |
| Laptop .exe (nanti) | Electron + electron-builder | Menjalankan web yang sama sebagai aplikasi Windows |
| iOS (nanti) | Capacitor iOS | Butuh Mac, Xcode, dan akun Apple Developer |
| Uji | Vitest (unit), Playwright (layar dan audit desain) | Bisa dijalankan di laptop |

Versi paket: pakai versi stabil terbaru saat dipasang, catat di package.json, jangan pakai versi beta.

### Informasi Bisnis, Akun Admin, & Rekening Pembayaran

1. **Akun Pemilik / Admin (Untuk Login Backoffice Laptop):**
   - Admin 1: `ghulamsze@gmail.com`
   - Admin 2: `robertusamaresi@gmail.com` (Pemilik Usaha / Kasir Utama)
   - *Catatan Tablet:* Perangkat tablet kasir POS **tidak membutuhkan login**; langsung membuka selektor kasir / POS untuk operasional cepat.

2. **Rekening Resmi Pembayaran Non-Tunai:**
   - Bank: **Bank Kaltimtara**
   - No. Rekening: **1747037252**
   - Atas Nama: **Hartati Jahri**

3. **QRIS Resmi:**
   - Merchant: **TATIS CAFE DAN RESTO, TLN**
   - NMID: **ID1026489183222**
   - Berkas Aset Bersih (tanpa frame luar biru): `/assets/images/qris-clean.png`

## 2. Struktur folder

```
tatie-kitchen/
  .agents/skills/tatie-kitchen-build/SKILL.md
  docs/design.md
  docs/arsitektur.md
  reference/tati_e-kitchen-final-preview.html
  supabase/migrations/        skema, RLS, RPC
  supabase/seed.sql           data awal dari HTML
  src/
    app/                      AppShell, router per perangkat
    lib/device/               deteksi perangkat (bagian 3)
    lib/supabase/             klien, tipe hasil generate
    lib/format/               rupiah, tanggal, zona waktu
    design/                   tokens.css, tema, palet, komponen dasar
    features/
      intro/  profil/  home/  menu-lengkap/  bayar/  struk/  riwayat/  akun/
    platform/tablet/          layar khusus tablet (fase ini)
    platform/laptop/          kosong, placeholder
    platform/phone/           kosong, placeholder
  e2e/                        Playwright
  capacitor.config.ts         dibuat di fase APK
  .env.example
```

## 3. Deteksi perangkat (navigator.userAgent)

Peringatan teknis: navigator.userAgent saja tidak cukup andal. iPad modern mengaku Macintosh, tablet dan ponsel Android sama-sama mengandung kata Android, Chrome mengurangi detail userAgent, dan saat beta aplikasi dijalankan di laptop sehingga userAgent akan selalu terbaca laptop. Karena itu deteksi memakai beberapa sinyal dan satu tombol override. userAgent tetap menjadi sinyal utama sesuai permintaan.

Modul: src/lib/device/detect.ts. Fungsi murni classifyDevice(env) sehingga bisa diuji dengan tabel contoh userAgent.

Hasil:
```
type DeviceInfo = {
  platform: 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'unknown'
  formFactor: 'phone' | 'tablet' | 'laptop'
  source: 'override' | 'capacitor' | 'client-hints' | 'user-agent'
  native: boolean
}
```

Urutan prioritas sinyal:
1. Override (untuk simulasi di laptop): parameter URL ?device=tablet|laptop|phone, disimpan di localStorage kunci tk-device. ?device=auto menghapusnya.
2. Capacitor: Capacitor.isNativePlatform(), Capacitor.getPlatform(), dan plugin @capacitor/device untuk platform.
3. Client Hints: navigator.userAgentData (platform dan mobile) bila tersedia.
4. navigator.userAgent dengan aturan:
   - iPhone atau iPod: ios, phone
   - iPad: ios, tablet
   - Macintosh dengan navigator.maxTouchPoints lebih dari 1: ios, tablet (iPadOS)
   - Android dengan kata Mobile: android, phone
   - Android tanpa kata Mobile: android, tablet
   - Windows NT: windows, laptop
   - Macintosh tanpa sentuhan: mac, laptop
   - Linux, X11, CrOS: linux, laptop
5. Penajam: untuk android, jika sisi terpendek layar (CSS px) 600 atau lebih, anggap tablet.

Pemakaian:
- AppShell memilih antarmuka dari formFactor. Fase ini hanya tablet yang berfungsi. Laptop dan phone menampilkan layar sementara berbahasa Indonesia berisi informasi perangkat dan tulisan versi ini belum tersedia di perangkat tersebut.
- Perangkat didaftarkan ke tabel devices saat pertama dibuka dan last_seen_at diperbarui saat aplikasi aktif.
- Tidak boleh ada pengecekan userAgent di luar lib/device.

Simulasi tablet di laptop (beta):
- Buka dengan ?device=tablet. Komponen DevFrame menampilkan aplikasi di dalam bingkai 1024 x 640 yang diskalakan agar muat di jendela (logika sama seperti fungsi fit di HTML). DevFrame hanya aktif jika bukan native dan (mode dev atau VITE_BETA_FRAME=1).
- Chrome DevTools device mode juga bisa dipakai sebagai alternatif, tetapi hasil terbaik lewat DevFrame.

## 4. Data (Supabase Postgres)

Semua tabel punya shop_id. Uang disimpan integer rupiah (HTML menulis ribuan: 20 berarti Rp20.000, jadi dikali 1000 saat seed).

```sql
create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Makassar',
  created_at timestamptz not null default now()
);

create type member_role as enum ('owner', 'device');
create table shop_members (
  shop_id uuid references shops on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role member_role not null,
  primary key (shop_id, user_id)
);

create table cashiers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table menu_groups (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops on delete cascade,
  category text not null check (category in ('makanan','mie','snack','minuman')),
  name text not null,
  icon_key text not null,
  sort int not null default 0,
  unique (shop_id, name)
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops on delete cascade,
  group_id uuid not null references menu_groups on delete cascade,
  name text not null,
  price_idr int not null check (price_idr >= 0),
  available boolean not null default true,
  photo_path text,
  sort int not null default 0,
  active boolean not null default true
);

create table orders (
  id uuid primary key,                       -- dibuat di klien (idempoten)
  shop_id uuid not null references shops on delete cascade,
  cashier_id uuid not null references cashiers,
  device_id uuid,
  table_no text not null,
  total_idr int not null check (total_idr >= 0),
  cash_received_idr int not null,
  change_idr int not null check (change_idr >= 0),
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  menu_item_id uuid references menu_items,
  name_snapshot text not null,
  price_snapshot_idr int not null,
  qty int not null check (qty > 0)
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops on delete cascade,
  name text,
  platform text, form_factor text, user_agent text,
  last_seen_at timestamptz not null default now()
);

create view best_sellers with (security_invoker = true) as
  select oi.menu_item_id, sum(oi.qty) as qty
  from order_items oi join orders o on o.id = oi.order_id
  where o.created_at > now() - interval '30 days'
  group by oi.menu_item_id order by qty desc limit 7;
```

Aturan data:
- Terlaris di Menu lengkap diambil dari best_sellers. Sebelum ada data penjualan, pakai daftar awal TR dari HTML.
- Maksimal 7 item aktif per kelompok menu: validasi di aplikasi dan trigger di database.
- Menu habis memakai kolom available. Jangan hapus item yang sudah pernah terjual (pakai active false).
- Nama menu disalin apa adanya dari HTML. Salah ketik seperti Butterscote atau Cadburry dilaporkan ke pemilik, tidak diubah diam-diam.

## 5. Keamanan (RLS wajib)

- Aktifkan RLS di semua tabel. Tanpa pengecualian.
- Fungsi bantu is_member(shop uuid) dan is_owner(shop uuid), security definer, search_path dikunci.
- Perangkat tablet (role device): boleh membaca menu, kasir, dan order toko sendiri. Tidak boleh ubah harga atau hapus apa pun langsung.
- Perubahan dari tablet lewat RPC security definer:
  - set_item_availability(item_id, available)
  - create_order(order jsonb): server mengambil harga dari menu_items (tidak percaya harga dari klien), menghitung total dan kembalian, menolak jika uang diterima kurang, dan aman diulang karena orders.id dibuat di klien.
  - add_cashier(name)
- Owner (nanti, laptop dan Android): akses penuh ke toko sendiri.
- Kunci anon boleh ada di klien. Kunci service_role dilarang berada di kode klien, repo, atau file .env yang ikut build.
- File .env tidak masuk git. Sediakan .env.example.

Autentikasi tablet: pemilik membuat satu akun Supabase khusus perangkat (email dan kata sandi) dengan peran device. Tablet masuk sekali lewat layar setup tersembunyi (tersedia untuk pemilik), sesi disimpan. Pergantian kasir di layar Pilih profil tanpa kata sandi sesuai desain; profil kasir hanya penanda siapa yang bertugas (cashier_id di order). Keputusan ini perlu dikonfirmasi pemilik.

## 6. Penyimpanan foto

Bucket Supabase Storage menu-photos (privat atau publik baca, sesuai keputusan pemilik). Nama berkas mengikuti slug menu seperti di HTML (foto/mie-goreng-komplit.jpg). Jika foto belum ada, tampilkan slot gradien.

## 7. Struk

- Simpan: render struk menjadi PNG (html-to-image).
- Bagikan: Web Share API di web, plugin @capacitor/share di APK.
- Data struk dibaca dari order yang sudah tersimpan, bukan dari keranjang.

## 8. Online dan lingkungan

Variabel lingkungan: SUPABASE_URL / VITE_SUPABASE_URL, SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY (didukung dengan atau tanpa awalan VITE_ untuk kompatibilitas penuh dengan Supabase & Vercel), VITE_BETA_FRAME, VITE_APP_ENV (dev, beta, prod).

Dua proyek Supabase: dev (laptop) dan beta (online). Migrasi lewat Supabase CLI, tidak diubah lewat dashboard.

Aplikasi online: sambungkan repo ke Vercel, set variabel lingkungan, alamat HTTPS dibagikan untuk uji dari tablet fisik lewat browser sebelum APK.

Offline: beta ini online-first. Pembuatan order memakai id dari klien sehingga aman untuk dicoba ulang. Antrean offline (outbox) menjadi fase berikutnya; rancang kode pembuatan order agar mudah dibungkus antrean.

## 9. APK tablet (Capacitor)

Syarat di laptop Windows: Node LTS, JDK 17, Android Studio dengan Android SDK. Antigravity menyiapkan proyek dan skrip; pembuatan APK dijalankan di mesin ini.

1. npm i @capacitor/core @capacitor/android @capacitor/share @capacitor/device dan npm i -D @capacitor/cli
2. capacitor.config.ts: appId com.tatiekitchen.kasir, appName Tati’e Kitchen, webDir dist
3. npm run build lalu npx cap add android lalu npx cap sync
4. Kunci orientasi landscape di AndroidManifest (sensorLandscape)
5. APK debug: di folder android jalankan gradlew assembleDebug; hasil app-debug.apk. Pasang ke tablet lewat adb install atau salin berkas.
6. APK rilis: buat keystore, simpan cadangannya di tempat aman (hilang berarti tidak bisa memperbarui aplikasi), lalu build rilis yang ditandatangani.
7. Skrip npm: build:apk:debug, build:apk:release.

## 10. Uji beta di laptop

Jalankan: npm run dev lalu buka http://localhost:5173/?device=tablet.

Daftar uji:
- Deteksi: tabel userAgent (iPhone, iPad, iPadOS memakai Macintosh dengan sentuhan, Android phone, Android tablet, Windows, Mac) lulus.
- Layar: setiap layar tablet cocok dengan HTML referensi (Playwright, viewport 1024 x 640, bandingkan visual).
- Audit desain (design.md bagian 13) lulus untuk enam palet di mode terang dan gelap.
- Alur utama: pilih profil, tambah menu, tandai habis lalu tersedia, nomor meja, bayar tunai, kembalian, struk, riwayat hari ini dan rentang waktu, ganti tampilan.
- Data: order tersimpan di Supabase dengan total dari server; mencoba ulang order yang sama tidak menggandakan data; perangkat device tidak bisa mengubah harga.
- Intro sekitar 1,25 detik, dan 0,7 detik dengan reduced-motion.

## 11. Peta jalan (belum dikerjakan)

1. Laptop: web admin pemilik (Home, Riwayat, Menu, Kasir, Laporan, Pengaturan, Akun, Cetak menu) menggunakan folder `src/platform/laptop/`, lalu dibungkus Electron menjadi `.exe`. Login autentikasi Supabase Auth.
2. Android & iOS pemilik: Capacitor menggunakan folder `src/platform/phone/`, pemantauan transaksi harian real-time (read-only).
3. Supabase Realtime Subscription: Direncanakan aktif pada fase Laptop dan Mobile monitoring. Pada fase Tablet Kasir Beta, fungsi `subscribeToMenuChanges()` disediakan sebagai stub/logger peringatan karena perubahan menu kasir diperbarui saat peluncuran atau refresh manual.
Setiap tahap memakai skema Supabase yang sama dan hanya menambah folder di `src/platform/`.

## 12. Keputusan yang telah dikonfirmasi pemilik

- **Akun Pemilik / Admin**: `robertusamaresi@gmail.com` (kata sandi: `tatiekitchen*1`) dan `ghulamsze@gmail.com`.
- **Perangkat Tablet**: POS Kasir khusus, TIDAK memerlukan login akun/autentikasi (langsung masuk ke pemilihan kasir/layar kasir).
- **Zona Waktu**: WITA (Asia/Makassar, UTC+8) telah terkonfigurasi pada format tanggal, jam, dan perputaran antrean harian (reset 00:00 WITA).
- **Antrean Offline (Outbox)**: Telah diimplementasikan via `syncQueueStore` dengan auto-sync saat koneksi kembali online, sehingga kasir tidak macet jika jaringan terputus.
- **Rekening Transfer Toko**: Bank Kaltimtara, No. Rek `1747037252`, a.n. `Hartati Jahri`.
- **Nama Paket Aplikasi**: `com.tatiekitchen.kasir`.

## 13. Arsitektur Realtime (Fase Laptop & Mobile Monitoring)

- **Tabel yang Membutuhkan Realtime**:
  1. `menu_items`: Pembaruan status ketersediaan menu (`available`) atau perubahan harga agar kasir dan pembeli selalu melihat data terkini secara langsung.
  2. `orders` & `order_items`: Notifikasi transaksi masuk seketika dari kasir tablet ke dashboard monitoring pemilik di laptop dan ponsel.
- **Pola Langganan (Subscription Pattern)**:
  - Menggunakan saluran per-toko (*per-shop channel*): `supabase.channel(`shop:${shop_id}:changes`)`.
  - Filter Postgres Changes: `filter: `shop_id=eq.${shop_id}``.
  - Manajemen Siklus Hidup (*Lifecycle*): Hanya aktif saat aplikasi berada di latar depan (*foreground*). Channel otomatis di-unsubscribe saat aplikasi diminimalkan atau masuk background guna menghemat daya baterai dan kuota websocket.
- **Jadwal Implementasi**:
  - Diimplementasikan penuh pada Fase 7+ bersamaan dengan pembangunan antarmuka Laptop Web Admin dan aplikasi Android/iOS pemilik.
  - Pada fase Tablet Kasir Beta saat ini, POS menggunakan transaksi RPC idempotensial dan antrean offline `syncQueueStore`.

