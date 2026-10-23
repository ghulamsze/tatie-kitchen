# Panduan Instalasi & Penggunaan APK HP Android (Mode Pemilik) — Tati’e Kitchen

Aplikasi Tati’e Kitchen menggunakan **arsitektur kode tunggal (Unified Hybrid App)** berbasis **React 18 + TypeScript + Supabase + Capacitor Android**. 

Satu berkas APK yang sama (`app-debug.apk`) dapat dipasang di **Tablet Kasir** maupun **HP Android Pemilik**. Sistem native Android akan otomatis mendeteksi ukuran layar (*smallest screen width*) saat aplikasi dibuka:
- **Tablet (Lebar Layar $\ge$ 600dp):** Otomatis mengunci orientasi ke **Lanskap** (`sensorLandscape`) dan menampilkan **Antarmuka Kasir Lengkap (POS Tablet)**.
- **HP / Smartphone (Lebar Layar < 600dp):** Otomatis mengunci orientasi ke **Potret** (`sensorPortrait`) dan menampilkan **Antarmuka Pemantau Transaksi Pemilik (Owner Dashboard)**.

---

## 1. Lokasi Berkas APK

Berkas APK debug siap pasang telah sukses dikompilasi di laptop Anda:
- **Lokasi File:**  
  `android/app/build/outputs/apk/debug/app-debug.apk`
- **Ukuran File:** ~9.94 MB
- **Package ID:** `com.tatiekitchen.kasir`
- **Kompatibilitas:** Android 7.0 (API level 24) ke atas hingga Android 14 / 15.

---

## 2. Cara Memasang (Install) APK ke HP Android Pemilik

Pilih salah satu cara termudah berikut:

### Cara A: Melalui Kabel USB & ADB (Paling Cepat untuk Developer)
1. Aktifkan **Opsi Pengembang (Developer Options)** dan **USB Debugging** di HP Android Anda:
   - Buka **Pengaturan** $\rightarrow$ **Tentang Ponsel** $\rightarrow$ ketuk **Nomor Versi / Build Number** sebanyak 7 kali hingga muncul pesan *"Anda sekarang adalah pengembang"*.
   - Buka **Pengaturan Sistem** $\rightarrow$ **Opsi Pengembang** $\rightarrow$ aktifkan **USB Debugging**.
2. Hubungkan HP ke laptop menggunakan kabel USB.
3. Di terminal PowerShell laptop, jalankan:
   ```powershell
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. Aplikasi **Tatie Kitchen** akan otomatis terpasang di menu utama HP.

---

### Cara B: Dikirim via WhatsApp / Google Drive / Telegram (Paling Praktis untuk Pemilik)
1. Salin berkas `app-debug.apk` dari laptop:
   - Kirimkan file tersebut ke ruang obrolan WhatsApp pribadi, Google Drive, atau Telegram.
2. Buka dan unduh berkas `app-debug.apk` langsung di HP Android Anda.
3. Ketuk berkas APK tersebut untuk memulai instalasi:
   - Jika muncul peringatan keamanan *"Demi keamanan, ponsel Anda tidak diizinkan memasang aplikasi yang tidak dikenal dari sumber ini"*, pilih **Setelan (Settings)** lalu aktifkan **Izinkan dari sumber ini (Allow from this source)**.
4. Ketuk **Pasang (Install)** dan tunggu beberapa detik hingga selesai.
5. Ketuk **Buka (Open)** untuk mulai memantau transaksi warung.

---

## 3. Fitur Utama di HP Android Pemilik

Antarmuka HP dirancang khusus seringkas dan seefisien mungkin untuk pemilik warung yang sering bepergian, berbelanja bahan baku, atau memantau dari rumah tanpa perlu membuka laptop:

```
┌──────────────────────────────────────┐
│  Tati'e Kitchen - Ringkasan Pemilik  │
│  [23 Okt 2026] [Hari Ini v]          │
├──────────────────────────────────────┤
│  TOTAL PENJUALAN                     │
│  Rp 1.485.000                        │
│                                      │
│  [32 Transaksi]    [Rp 46.400 / Trx] │
│  Tunai: Rp 820.000  QRIS: Rp 665.000 │
├──────────────────────────────────────┤
│  RIWAYAT TRANSAKSI TERAKHIR          │
│                                      │
│  #032 • 14:45       LUNAS (QRIS)     │
│  3 Menu • Mie Goreng Komplit + 2...  │
│  Rp 48.000                           │
│  ──────────────────────────────────  │
│  #031 • 14:20       LUNAS (Tunai)    │
│  1 Menu • Es Teh Manis               │
│  Rp 5.000                            │
└──────────────────────────────────────┘
│ [Transaksi]      [Tema & Tampilan]   │
└──────────────────────────────────────┘
```

### 1. Kartu Indikator Kinerja Utama (KPI)
- **Total Omzet Bersih:** Angka total omzet besar berwarna hijau tebal (*Lime Accent*).
- **Jumlah Transaksi & Rata-rata Keranjang (Basket Size):** Mengetahui rata-rata pengeluaran tiap pelanggan yang datang.
- **Komparasi Metode Bayar:** Perbandingan instan berapa uang fisik di laci kasir (Tunai) dan berapa yang langsung masuk rekening QRIS.

### 2. Filter Rentang Waktu Fleksibel
Pilih rentang data dengan 1 ketukan:
- **Hari Ini** (bawaan saat aplikasi dibuka)
- **Kemarin**
- **Minggu Ini**
- **Bulan Ini**
- **Kustom** (memilih tanggal mulai dan tanggal akhir spesifik)

### 3. Pemantauan Real-time (Supabase WebSocket)
- Setiap kali kasir di meja kasir menekan tombol **Selesai Bayar** di tablet, transaksi baru akan langsung muncul di baris paling atas HP pemilik dalam hitungan detik **tanpa perlu tarik-turun untuk refresh**.
- Total omzet dan jumlah transaksi otomatis bertambah seketika.

### 4. Rincian Transaksi & Bagikan Struk
- Ketuk baris transaksi mana pun untuk membuka lembar rincian pesanan (*Detail Sheet*).
- Menampilkan nomor antrean harian, daftar menu pesanan, catatan pedas/manis, subtotal, dan metode bayar.
- Tombol **Bagikan Struk** memanfaatkan fitur bawaan sistem Android (`@capacitor/share`) untuk mengirim bukti struk langsung ke WhatsApp pelanggan jika diperlukan.

### 5. Mode Tampilan (Gelap / Terang)
- Buka tab **Tampilan** di navigasi bawah.
- Tersedia opsi **Mengikuti Sistem**, **Mode Terang**, atau **Mode Gelap (Dark Mode)**. Mode gelap menggunakan latar belakang pekat `#101416` yang sangat nyaman di mata dan hemat daya baterai untuk layar OLED/AMOLED smartphone modern.

---

## 4. Uji Coba Sinkronisasi Real-Time (Tablet $\leftrightarrow$ HP)

Untuk memastikan kedua perangkat tersambung sempurna ke database awan Supabase:
1. Buka aplikasi Tati’e Kitchen di **Tablet Kasir** dan di **HP Pemilik**.
2. Pastikan kedua perangkat terhubung ke internet (Wi-Fi atau Data Seluler).
3. Di **Tablet Kasir**:
   - Tambahkan 1 menu (misal: *Nasi Goreng Spesial*).
   - Pilih metode pembayaran **QRIS**, lalu ketuk **Konfirmasi & Cetak**.
4. Perhatikan layar **HP Pemilik**:
   - Dalam rentang waktu kurang dari 1–2 detik, transaksi baru `#...` akan langsung berkedip muncul di posisi teratas riwayat transaksi.
   - Total penjualan bertambah otomatis tanpa menyentuh layar HP.

---

## 5. Cara Kompilasi Ulang APK (Jika Ada Pembaharuan)

Jika Anda melakukan perubahan styling, penambahan filter, atau pembaruan kode di masa mendatang, cukup jalankan perintah berikut di terminal:

```powershell
npm run build:apk:phone:debug
```

Perintah ini akan menjalankan urutan otomatis:
1. `npm run build`: Kompilasi kode React + TypeScript Vite production.
2. `npx cap sync`: Sinkronisasi bundle web dan plugin native ke Android.
3. `node scripts/strip-reparse.mjs`: Pembersihan atribut Windows OneDrive ReparsePoint secara otomatis agar Gradle tidak terhambat.
4. `gradlew.bat assembleDebug`: Menghasilkan berkas APK baru siap pasang di `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 6. Pertanyaan yang Sering Diajukan (FAQ)

> **T: Mengapa HP saya tidak bisa dipakai menginput pesanan seperti kasir?**  
> **J:** Sesuai cetak biru desain dan kebutuhan bisnis Tati’e Kitchen, kasir meja depan menggunakan tablet lanskap untuk memproses pesanan dan terhubung ke printer thermal Bluetooth. HP dirancang khusus untuk pemilik agar dapat memantau uang masuk, mengontrol omzet secara aman dari jarak jauh, dan memeriksa pesanan tanpa risiko tertekan salah transaksi.

> **T: Apakah HP pemilik harus menggunakan jaringan Wi-Fi yang sama dengan kasir?**  
> **J:** Tidak perlu. Tablet kasir dan HP pemilik terhubung langsung melalui Supabase Cloud Database. HP pemilik dapat memantau dari mana saja menggunakan koneksi data seluler (4G/5G).

> **T: Apakah aplikasi HP ini boros kuota internet?**  
> **J:** Sangat hemat. Aplikasi hanya bertukar data teks JSON berukuran beberapa kilobyte melalui protokol WebSocket Supabase saat ada transaksi baru yang terjadi. Seluruh tampilan dan ikon sudah tersimpan lokal di dalam berkas APK.
