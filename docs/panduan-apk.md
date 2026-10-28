# Panduan Build & Instalasi Aplikasi Tati’e Kitchen (Android & iOS)

Aplikasi kasir dan pemantau transaksi Tati’e Kitchen dibangun dengan arsitektur **Unified Hybrid App (React + TypeScript + Supabase + Capacitor)**. Satu basis kode dapat dijalankan di:
- **Tablet Kasir POS** (Lanskap $\ge$ 600dp): Kasir kasir cepat, pesanan, cetak struk thermal Bluetooth.
- **HP Android / iPhone Pemilik** (Potret < 600dp): Ringkasan omzet real-time, riwayat transaksi, kelola kasir/menu, bagikan struk digital.

---

## 1. Lokasi Berkas & Build Otomatis

### Berkas APK Siap Pasang:
- **File:** `android/app/build/outputs/apk/debug/Tatie-Kitchen-v0.1.0.apk` (atau `./Tatie-Kitchen-v0.1.0.apk` di folder utama).
- **ID Paket:** `com.tatiekitchen.kasir`
- **Kompatibilitas:** Android 7.0 (API 24) hingga Android 15+.

### Cara Mengompilasi Ulang APK:
Jalankan perintah berikut di terminal:
```powershell
# 1. Kompilasi web & sinkronkan aset ke Android
npm run build
npx cap sync android

# 2. Kompilasi APK debug native
.\android\gradlew.bat -p android assembleDebug
```
*Hasil APK otomatis tersimpan di `android/app/build/outputs/apk/debug/Tatie-Kitchen-v0.1.0.apk`.*

---

## 2. Cara Memasang (Install) ke Perangkat Android (Tablet / HP)

Pilih salah satu cara termudah berikut:

### Cara A: Melalui Kabel USB & ADB (Paling Cepat)
1. Aktifkan **Opsi Pengembang (Developer Options)** dan **USB Debugging** di perangkat Android:
   - Masuk ke *Pengaturan* $\rightarrow$ *Tentang Ponsel/Tablet* $\rightarrow$ ketuk *Nomor Versi (Build Number)* sebanyak 7 kali.
   - Buka *Opsi Pengembang* $\rightarrow$ aktifkan *USB Debugging*.
2. Hubungkan perangkat ke laptop via kabel data USB.
3. Jalankan di terminal:
   ```powershell
   adb install -r android/app/build/outputs/apk/debug/Tatie-Kitchen-v0.1.0.apk
   ```

### Cara B: Salin Berkas / Kirim via WhatsApp / Drive (Paling Praktis)
1. Kirim file `Tatie-Kitchen-v0.1.0.apk` ke WhatsApp pribadi, Google Drive, atau Telegram.
2. Unduh file di HP atau Tablet Android.
3. Ketuk file APK untuk memasang. Jika diminta izin keamanan, aktifkan *Izinkan dari sumber ini (Allow from this source)*.
4. Aplikasi langsung terpasang dan siap digunakan.

---

## 3. Cara Memasang di Perangkat iOS (iPhone / iPad)

Karena sistem keamanan Apple iOS tidak mengizinkan pemasangan file `.apk`, aplikasi iOS menggunakan proyek native Xcode yang berada di folder `ios/App/`.

### Opsi 1: PWA Add to Home Screen (Instan, Tanpa Mac / Komputer)
1. Buka link web hosting aplikasi (misal `https://tatie-kitchen.vercel.app`) di browser **Safari** pada iPhone/iPad.
2. Ketuk tombol **Share** (ikon kotak dengan panah ke atas di bagian bawah layar).
3. Gulir ke bawah dan pilih **Add to Home Screen (Tambahkan ke Layar Utama)**.
4. Aplikasi akan tampil layaknya aplikasi native iOS dengan icon dan layar penuh tanpa bilah Safari.

### Opsi 2: Menggunakan Mac & Xcode (Aplikasi Native Asli)
1. Buka proyek iOS di Xcode pada perangkat Mac:
   ```bash
   npx cap open ios
   ```
2. Hubungkan iPhone/iPad via kabel Lightning/USB-C ke Mac.
3. Pada Xcode, buka menu **Signing & Capabilities** $\rightarrow$ pilih **Team** akun Apple ID Anda.
4. Pilih target perangkat fisik Anda di bagian atas Xcode, lalu klik tombol **Run** (Play $\blacktriangleright$).
5. Pada iPhone/iPad: Masuk ke *Settings* $\rightarrow$ *General* $\rightarrow$ *VPN & Device Management* $\rightarrow$ percayai sertifikat akun Apple Anda.

### Opsi 3: Menggunakan Sideloadly / AltStore (Dari Laptop Windows Tanpa Mac)
1. Unduh bundel IPA hasil kompilasi GitHub Actions (dari tab *Actions* di repository GitHub).
2. Pasang [Sideloadly](https://sideloadly.io/) di laptop Windows.
3. Hubungkan iPhone ke laptop, seret file `.ipa` ke Sideloadly, masukkan Apple ID Anda, dan klik **Start**.

---

## 4. Printer Thermal Bluetooth (VSC MP-58X)
1. Nyalakan printer thermal VSC MP-58X (58mm ESC/POS).
2. Hubungkan Bluetooth melalui Pengaturan perangkat fisik Anda (PIN: `0000` atau `1234`).
3. Di dalam aplikasi Tati’e Kitchen, buka tab **Akun** $\rightarrow$ **Printer Thermal** $\rightarrow$ pilih printer $\rightarrow$ **Uji Cetak**.
4. Aktifkan **Cetak Struk Otomatis** untuk pencetakan instan saat transaksi selesai.

---

## 5. Mode Offline & Sinkronisasi
Jika koneksi internet terputus saat transaksi kasir di warung:
- Transaksi tetap berjalan normal dan nomor antrean bertambah secara berurutan.
- Data disimpan di antrean lokal (`syncQueueStore`).
- Saat koneksi internet kembali aktif, sistem otomatis menyinkronkan seluruh pesanan yang tertunda ke Supabase.
