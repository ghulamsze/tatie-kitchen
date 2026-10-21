# Panduan Instalasi & Build APK Tablet Tati’e Kitchen (Fase 8)

Aplikasi kasir tablet Tati’e Kitchen telah berhasil dikonfigurasi menggunakan **Capacitor** dengan ID paket `com.tatiekitchen.kasir` dan orientasi dikunci ke lanskap (`sensorLandscape`).

Berkas APK debug telah sukses dikompilasi di mesin Anda:
**Lokasi Berkas:**
`android/app/build/outputs/apk/debug/app-debug.apk` (Ukuran: ~4.49 MB)

---

## 1. Cara Memasang (Install) APK ke Tablet Android Fisik

Pilih salah satu metode termudah di bawah ini:

### Cara A: Melalui Kabel Data USB & ADB (Paling Cepat)
1. Aktifkan **Opsi Pengembang (Developer Options)** dan **USB Debugging** di tablet Android Anda:
   - Buka *Pengaturan* -> *Tentang Tablet* -> ketuk *Nomor Versi (Build Number)* sebanyak 7 kali.
   - Buka *Opsi Pengembang* -> aktifkan *USB Debugging*.
2. Hubungkan tablet ke laptop dengan kabel data USB.
3. Di terminal laptop, jalankan:
   ```powershell
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. Aplikasi Tati’e Kitchen akan terpasang di tablet dan siap dibuka.

### Cara B: Menyalin Berkas Langsung / Berbagi Berkas
1. Salin berkas `app-debug.apk` dari laptop Anda:
   - Bisa melalui kabel USB (folder Download tablet),
   - Atau kirim ke WhatsApp / Google Drive / Telegram pribadi Anda, lalu unduh langsung di tablet.
2. Buka berkas `app-debug.apk` di tablet, izinkan instalasi dari *Sumber Tidak Dikenal (Unknown Sources)* jika diminta.
3. Ketuk **Pasang (Install)**.

---

## 2. Cara Mengompilasi Ulang APK Debug (Jika Ada Perubahan Kode)

Setelah mengubah kode tampilan atau fitur web, cukup jalankan skrip otomatis:
```powershell
npm run build:apk:debug
```
Perintah ini akan otomatis:
1. Mengompilasi kode React & TypeScript (`npm run build`).
2. Menyinkronkan aset web ke proyek Android (`npx cap sync`).
3. Mengompilasi APK debug native menggunakan Gradle (`gradlew assembleDebug`).

---

## 3. Panduan Membuat Keystore & APK Rilis (Signed Release APK)

Untuk keperluan produksi atau upload ke Play Store:

> [!CAUTION]
> Simpan berkas keystore dan kata sandinya di tempat yang sangat aman dan buat cadangannya. Jika keystore hilang, aplikasi yang terpasang tidak akan bisa diperbarui lagi.

### Langkah 1: Buat Keystore (Jalankan Sekali Saja)
```powershell
keytool -genkey -v -keystore tatie-kitchen.keystore -alias tatie-kasir -keyalg RSA -keysize 2048 -validity 10000
```
*(Catat kata sandi dan simpan berkas `tatie-kitchen.keystore`)*.

### Langkah 2: Buat APK Rilis
```powershell
npm run build:apk:release
```
Hasil berkas rilis akan berada di:
`android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 4. Konfigurasi Orientasi & Plugin yang Digunakan
- **Orientasi:** `sensorLandscape` (otomatis mengikuti arah pegangan tablet horizontal).
- **Plugin Native:**
  - `@capacitor/device`: Deteksi informasi perangkat keras tablet.
  - `@capacitor/share`: Membuka dialog berbagi struk bawaan Android.
