# Panduan Deploy Tati’e Kitchen ke Vercel (Fase 7: Online)

Dokumen ini adalah panduan langkah demi langkah bagi pemilik untuk mendeploy aplikasi kasir tablet Tati’e Kitchen ke Vercel secara online dengan alamat HTTPS publik.

---

## 1. Persiapan Variabel Lingkungan (Environment Variables)

Saat melakukan konfigurasi proyek di Vercel, siapkan 4 variabel lingkungan berikut:

| Nama Variabel | Nilai | Keterangan |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://fiaetjtqhvdewqffliai.supabase.co` | URL Supabase proyek Anda |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_JQwXFsdu3S-BosZugbD4pw_ei_cNBdP` | Kunci anon/publishable publik |
| `VITE_APP_ENV` | `production` | Lingkungan aplikasi (atau `beta`) |
| `VITE_BETA_FRAME` | `1` | Mengaktifkan bingkai simulasi tablet di laptop |

---

## 2. Cara A: Deploy Melalui Vercel Dashboard (Paling Mudah & Disarankan)

1. **Masuk ke Vercel:**
   - Kunjungi [https://vercel.com](https://vercel.com) dan login (disarankan menggunakan akun GitHub Anda).
2. **Impor Repository:**
   - Klik tombol **"Add New..."** lalu pilih **"Project"**.
   - Cari dan pilih repositori Git proyek Tati’e Kitchen Anda.
3. **Konfigurasi Project:**
   - **Framework Preset:** Pilih `Vite` (Vercel biasanya mendeteksi secara otomatis).
   - **Root Directory:** `./` (akar direktori proyek).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Masukkan Environment Variables:**
   - Buka bagian **"Environment Variables"** dan tambahkan 4 variabel dari tabel di atas.
5. **Klik "Deploy":**
   - Vercel akan otomatis mengompilasi bundel produksi dan menghasilkan domain publik, contohnya:
     `https://tatie-kitchen.vercel.app` (atau nama domain yang Anda pilih).

---

## 3. Cara B: Deploy Melalui Vercel CLI (Dari Terminal Laptop)

Jika Anda lebih menyukai menggunakan terminal:

1. Jalankan perintah instalasi Vercel CLI:
   ```bash
   npx vercel login
   ```
   (Ikuti instruksi di browser untuk mengotorisasi terminal).
2. Jalankan perintah deploy pratinjau:
   ```bash
   npx vercel
   ```
   - Masukkan pengaturan default saat ditanya (Output directory: `dist`).
3. Deploy langsung ke produksi:
   ```bash
   npx vercel --prod
   ```

---

## 4. Konfigurasi vercel.json yang Sudah Disiapkan

Aplikasi telah dilengkapi dengan berkas [vercel.json](file:///c:/Users/lenovo/OneDrive/Documents/00%20-%20Arsip%20Akademik/D%20-%20Coding/01%20-%20Rekayasa%20Perangkat%20Lunak/vercel.json) di akar proyek:
- **SPA Rewrites:** Seluruh rute otomatis diarahkan ke `index.html`.
- **Cache-Control:** Berkas aset biner (font, skrip terkompilasi, CSS) di-cache secara permanen (`max-age=31536000, immutable`).
- **Security Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, dan `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 5. Cara Menjalankan Smoke Test Setelah Deploy

Setelah mendapatkan URL HTTPS publik dari Vercel (misal: `https://tatie-kitchen.vercel.app`):

1. **Uji dari Browser Laptop:**
   - Buka `https://tatie-kitchen.vercel.app/?device=tablet`
   - Pastikan layar kasir terbuka di dalam DevFrame proporsional 1024×640.
   - Coba lakukan 1 transaksi tes: tambah menu, klik *"Lanjut ke meja & bayar"*, pilih nomor meja, dan klik *"Selesaikan pembayaran"*.
2. **Uji dari Browser Tablet Fisik (jika ada):**
   - Buka `https://tatie-kitchen.vercel.app` langsung dari peramban tablet (Chrome/Safari) dalam orientasi lanskap.
   - Sistem akan langsung mendeteksi tablet fisik dan menyajikan layar penuh tanpa bingkai simulasi laptop.
3. **Uji Otomatis via Terminal:**
   - Jalankan Playwright smoke test terhadap URL produksi:
     ```bash
     $env:BASE_URL="https://tatie-kitchen.vercel.app"; npx playwright test e2e/smoke-test.spec.ts
     ```
