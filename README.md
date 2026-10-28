# Tati’e Kitchen — Modern Point of Sale (POS) & Cashier App

> Sistem kasir digital multi-platform yang cepat, tangguh, dan elegan untuk UMKM kuliner **Tati’e Kitchen** (Nunukan, Kalimantan Utara). Dirancang khusus untuk operasional kasir tablet (layar lanskap), pendamping ponsel (Android smartphone), dan antarmuka web dengan sinkronisasi realtime database.

---

## 🌟 Fitur Utama

- **🚀 Transaksi Kasir Instan & Ergonomis (Tablet 1024x640)**
  - Tampilan kasir tablet berbasis grid intuitif dengan visual produk tanpa batas putih (*clean alpha WebP*).
  - Keranjang dinamis, kalkulator pecahan uang cepat (*exact match* & nominal bulat), kalkulasi kembalian otomatis.
  - Multi-metode pembayaran: **Tunai (Cash)** dan **QRIS Dinamis / Statis**.

- **📱 Versi Ponsel Pemilik & Kasir (Android Phone View)**
  - Manajemen katalog menu (tambah, edit harga, toggle ketersediaan habis/tersedia).
  - Pengelolaan data kasir bertugas dan profil pemilik toko.
  - Crop foto 1:1 otomatis beresolusi tetap sebelum diunggah ke cloud.
  - Dialog interaksi foto murni ikon dengan animasi *zoom-out* dan gestur *hold* halus.

- **🖨️ Cetak Struk Thermal Bluetooth (58mm / 80mm)**
  - Integrasi native Bluetooth Serial ESC/POS via Capacitor.
  - Pratinjau struk presisi piksel sesuai tata letak cetak fisik toko.
  - Opsi potong kertas otomatis (*auto-cutter*) dan duplikat salinan struk dapur.

- **⚡ Sinkronisasi Cloud Realtime & Mode Offline**
  - Penyimpanan data lokal (*local-first*) berketahanan tinggi menggunakan IndexedDB/LocalStorage.
  - Sinkronisasi realtime ke **Supabase PostgreSQL** saat perangkat terhubung internet.
  - Reset antrian harian otomatis berbasis zona waktu toko (`Asia/Makassar` / WITA).

- **🎨 Desain Antarmuka Premium (Liquid Glass / Frosted Acrylic)**
  - Sistem token CSS terstandarisasi kelipatan 4 dengan palet warna HSL tematik (Lime, Amber, Rose, Cyan, Slate).
  - Efek *frosted glass* dan *acrylic blur* yang ringan dan teroptimasi untuk performa GPU perangkat mobile (*content-visibility* & *hardware acceleration*).

---

## 🛠️ Arsitektur & Teknologi

| Lapisan | Teknologi | Deskripsi |
|---|---|---|
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Komponen modular dengan pengetikan data ketat (*strict types*) |
| **Build Tool & Bundler** | [Vite 6](https://vitejs.dev/) | HMR ultra-cepat dan bundling produksi teroptimasi |
| **Mobile Runtime** | [Capacitor 7](https://capacitorjs.com/) | Wrapper Android native dengan bridge Bluetooth & Haptics |
| **Backend & Database** | [Supabase](https://supabase.com/) | PostgreSQL, Row-Level Security (RLS), Realtime Channels, dan Storage Bucket |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) | State terpusat untuk Kasir, Keranjang, Menu, dan Pengaturan Toko |
| **Styling** | Vanilla CSS (*Custom Design System*) | Tanpa bloat framework CSS; token visual presisi dan fluid |

---

## 📂 Struktur Direktori Proyek

```text
├── android/               # Kode sumber project Android native (Capacitor)
├── public/                # Aset statis publik (ikon, gambar menu WebP, sound feedback)
├── src/
│   ├── app/               # Root AppShell, router, dan layout switcher
│   ├── design/            # Sistem desain (tokens.css, components.css, reusable components)
│   ├── features/          # Modul fungsional tablet (kasir, menu, pembayaran, riwayat, akun)
│   ├── lib/               # Utility library (Supabase client, ESC/POS printer, Bluetooth, formatter)
│   ├── platform/          # Antarmuka adaptif spesifik perangkat (tablet & phone screens)
│   └── stores/            # State management global (cashierStore, cartStore, menuStore, shopStore)
├── supabase/              # Migrasi database SQL PostgreSQL & RLS policies
└── capacitor.config.ts    # Konfigurasi integrasi Android Capacitor
```

---

## 🚀 Memulai Pengembangan Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru
- [npm](https://www.npmjs.com/) versi 9+
- [Android Studio](https://developer.android.com/studio) (opsional, jika ingin melakukan kompilasi APK Android)

### Instalasi & Menjalankan Dev Server

```bash
# 1. Clone repositori
git clone https://github.com/ghulamsze/tatie-kitchen.git
cd tatie-kitchen

# 2. Pasang dependensi
npm install

# 3. Jalankan server pengembang lokal
npm run dev
```

Buka peramban di `http://localhost:5173`.

### Validasi Kode & Kompilasi Produksi

```bash
# Validasi tipe TypeScript
npm run test

# Build bundle produksi
npm run build

# Sinkronisasi aset web ke folder Android
npx cap sync android
```

---

## 🔒 Keamanan

- **Zero Hardcoded Secrets**: Seluruh komunikasi publik client hanya menggunakan Anon Key yang dibatasi oleh kebijakan ketat Supabase Row Level Security (RLS).
- **Hardened Mobile Sandboxing**: Perlindungan cadangan aplikasi dinonaktifkan (`android:allowBackup="false"`) untuk mencegah ekstraksi data lokal via debugging USB/ADB.
- **Fail-safe Avatar Isolation**: Deteksi kegagalan jaringan otomatis membersihkan referensi berkas rusak dari cache lokal secara mandiri.

---

## 📄 Lisensi

Hak Cipta © 2026 Tati’e Kitchen. Seluruh hak cipta dilindungi undang-undang.