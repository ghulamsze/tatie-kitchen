---
name: tatie-kitchen-build
description: Aturan kerja membangun aplikasi kasir Tati’e Kitchen secara bertahap (fase sekarang tablet) dengan React, TypeScript, Supabase, dan Capacitor. Pakai setiap kali menulis, mengubah, atau menguji kode, desain, database, atau build aplikasi ini.
---

# Skill: membangun Tati’e Kitchen

## Kapan dipakai

Setiap tugas pada proyek ini: layar, komponen, gaya, deteksi perangkat, skema Supabase, build web, APK, pengujian.

## Sumber kebenaran (baca sebelum bekerja)

1. reference/tati_e-kitchen-final-preview.html: tampilan dan perilaku. Menang untuk soal visual.
2. docs/design.md: aturan desain yang diringkas dari HTML.
3. docs/arsitektur.md: keputusan teknis. Menang untuk soal teknis.

Jika ada yang bertentangan atau tidak jelas, berhenti dan tanya pemilik. Jangan menebak.

## Cakupan sekarang

Hanya tablet kasir (landscape 1024 x 640), disimulasikan di laptop. Layar laptop, Android, iOS, dan Cetak menu belum dibangun. Boleh menyiapkan folder dan placeholder, tidak boleh membuat fiturnya.

## Aturan kerja

1. Satu fase dalam satu waktu, sesuai urutan di master prompt. Setiap fase: tulis rencana singkat, tunggu persetujuan, kerjakan, jalankan uji, laporkan, lalu berhenti. Jangan mulai fase berikutnya sebelum pemilik menulis Lanjut.
2. Satu fase satu cabang git dan commit kecil dengan pesan bahasa Indonesia yang jelas.
3. Setelah tiap fase, sertakan bukti: hasil uji, tangkapan layar, dan daftar berkas yang berubah.
4. Jangan mengubah berkas di reference/.
5. Jangan menambah paket di luar daftar arsitektur.md tanpa izin. Jelaskan alasan jika perlu.
6. Jangan menghapus atau menimpa data atau migrasi yang sudah ada. Perubahan skema selalu lewat migrasi baru.

## Aturan kode

- TypeScript strict. Tidak ada any tanpa komentar alasan.
- Gaya hanya memakai token dari src/design/tokens.css. Dilarang menulis warna, ukuran teks, radius, atau jarak langsung di komponen.
- Skala teks: hanya tujuh pasangan di design.md. Bobot 500, 700, 800. Jarak dan ukuran kelipatan 4. Target sentuh minimal 44. Satu tombol lime per layar.
- Semua teks antarmuka bahasa Indonesia baku, singkat. Uang Rp80.000 dari integer rupiah. Zona waktu dari pengaturan toko.
- Deteksi perangkat hanya lewat src/lib/device. Dilarang memeriksa navigator.userAgent di tempat lain.
- Akses Supabase hanya lewat src/lib/supabase dan hook di features/. Komponen layar tidak memanggil klien langsung.
- Perubahan data dari tablet hanya lewat RPC yang disebut di arsitektur.md. Harga dan total dihitung server.
- Font Plus Jakarta Sans dipasang lokal. Tanpa CDN pihak ketiga pada runtime.
- Hormati prefers-reduced-motion dan prefers-reduced-transparency.

## Keamanan

- RLS aktif di semua tabel dan diuji.
- Kunci service_role tidak boleh muncul di kode, repo, atau build. Hanya kunci anon di klien.
- Jangan mencetak atau mencatat kunci, token, atau kata sandi di log atau laporan.
- Perintah yang mengubah proyek Supabase online, menghapus data, atau memasang paket global harus menunggu persetujuan pemilik.

## Definisi selesai (setiap fase)

- Build web berhasil dan lint serta tipe bersih.
- Uji unit dan uji layar fase itu lulus.
- Layar yang dikerjakan dibandingkan dengan HTML referensi pada viewport 1024 x 640 dan perbedaannya dijelaskan.
- Audit desain lulus pada palet netflix terang dan gelap (semua enam palet pada fase uji beta).
- Laporan memakai format di bawah.

## Format laporan fase

Tulis polos, tanpa hiasan:
- Yang dikerjakan (daftar singkat)
- Berkas penting yang berubah
- Hasil uji (lulus atau gagal, dengan angka)
- Perbedaan dari HTML referensi dan alasannya
- Pertanyaan terbuka untuk pemilik
- Langkah manual yang harus dilakukan pemilik
- Usulan fase berikutnya

## Yang harus dikerjakan manual oleh pemilik (ingatkan saat relevan)

- Membuat proyek Supabase (dev dan beta) dan menempel URL serta kunci anon ke .env.
- Memasang Node LTS, Android Studio, dan JDK 17 sebelum fase APK.
- Menyimpan cadangan keystore APK rilis.
