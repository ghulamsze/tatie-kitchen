# design.md Tati’e Kitchen

Sumber kebenaran visual: reference/tati_e-kitchen-final-preview.html (v13). Dokumen ini merangkum aturannya. Jika dokumen ini berbeda dengan HTML, HTML yang menang untuk tampilan, lalu laporkan perbedaannya.

Cakupan fase sekarang: tablet kasir, landscape 1024 x 640 (desain acuan). Layar laptop, Android pemilik, iOS pemilik, dan fitur Cetak menu ada di HTML tetapi belum dibangun.

## 1. Prinsip

- Satu sumber kebenaran: semua layar memakai token. Dilarang menulis warna, ukuran, atau radius langsung di komponen.
- Konsisten di atas segalanya: skala teks, grid, bentuk, material, dan prioritas highlight berlaku di semua layar.
- Satu tombol lime (aksi utama) per layar.

## 2. Teks

Hanya tujuh pasangan ukuran/line-height (px). Bobot hanya 500, 700, 800. Font: Plus Jakarta Sans (pasang lokal lewat paket npm, jangan pakai CDN Google supaya APK tetap tampil benar saat offline). Fallback: system-ui.

| Token | Ukuran | Line-height | Dipakai untuk |
|---|---|---|---|
| xs | 12 | 16 | keterangan kecil, jam, jumlah item |
| sm | 14 | 20 | catatan, chip, navbar, toast |
| md | 16 | 24 | isi, tombol, baris |
| lg | 20 | 28 | judul panel, sheet |
| xl | 32 | 40 | judul layar (heading layar) |
| 2xl | 44 | 52 | angka besar, wordmark |
| 3xl | 64 | 72 | intro wordmark, kembalian |

Teks 24px ke atas dihitung teks besar WCAG (kontras minimal 3:1). Teks lain minimal 4,5:1.

## 3. Grid dan kontrol

- Padding, margin, gap, lebar, tinggi: kelipatan 4.
- Tinggi kontrol: 40, 48, 56. Target sentuh minimal 44.
- Tombol utama dan tombol sekunder di layar tablet memakai tinggi 56.

## 4. Bentuk

Radius: 12 (sm), 16 (md, kontrol), 24 (lg, panel), 32 (xl, sheet dan avatar), pil (chip, navbar, rentang, toast).

## 5. Material

Pendekatan web, bukan material resmi Apple.

- Liquid glass: hanya lapisan melayang (navbar pil, sheet, menu, tag harga, toast).
- Frosted acrylic: panel konten.
- Kontrol dan baris: fill datar tanpa blur (background var(--ctl), border var(--ctl-line)).
- Glass: gradien 135 derajat putih 24% ke 6% di atas rgba(8,24,30,.34), backdrop blur 28px saturate 180%, border 1px putih 36%, highlight dalam atas, bayangan 0 18px 40px.
- Wajib ada fallback untuk prefers-reduced-transparency: latar solid rgba(10,45,45,.95) tanpa blur.
- Wajib hormati prefers-reduced-motion.

## 6. Prioritas highlight

1. Tombol lime (satu per layar)
2. Kartu aksen (.hi)
3. Liquid glass
4. Frosted acrylic
5. Datar

## 7. Tema dan palet

Mode: Sistem, Terang, Gelap. Disimpan di localStorage kunci tk-theme (nilai system, light, dark; bawaan dark). Palet disimpan di kunci tk-pal. Palet bawaan: netflix. Diterapkan lewat atribut pada elemen html: data-theme dan data-palette.

Enam palet (nilai gelap, lalu terang). Salin nilai lengkap dari blok CSS di HTML referensi.

| Palet | bg gelap | accent | bg terang | accent-ink terang |
|---|---|---|---|---|
| netflix | #141112 | #d92b33 | #f4f2f1 | #b3121a |
| mono (Minimal hitam putih) | #0b0b0c | #f5f5f5 | #f6f6f6 | #111112 |
| hijau | #04201f | #c6f36a | #eef6f1 | #17653a |
| samudra | #051428 | #ffd166 | #eaf2fb | #7a5000 |
| senja | #1f0b0e | #8af0cf | #fbf0eb | #0b6b52 |
| blush | #1d1015 | #f4a3b7 | #fbeff1 | #a3304f |

Token per palet: bg, fg, mut, scr-bg, b1, b2, b3, accent, on-accent, accent-ink, ring, danger. Token bersama: ink, ink-2, ink-3, w, hl, sh, tint, fl-bg, ov, mc-bg, chip-bg, solid, edge, ctl, ctl-line, sel, noise. Semua ada di :root HTML referensi.

Pemilihan palet di layar Tampilan hanya berupa swatch warna (bulatan dua warna, tanpa teks), berlaku untuk semua layar.

## 8. Latar layar

Latar layar memakai scr-bg dengan tiga gradien radial blur 26px (titik b1 di kiri atas, b2 di bawah tengah, b3 di kanan bawah), inset -12%. Konten berada di atasnya.

## 9. Komponen

- Tombol utama (lime): latar var(--accent), teks var(--on-accent), bobot 700, tinggi 56, radius 16, highlight dalam putih 60%.
- Tombol sekunder (.bay.g, .rg.g): datar, lihat bagian 5.
- Chip: padding 8 x 16, pil, 14/20 bobot 700, latar var(--chip-bg).
- Navbar pil: tiga item Home, Riwayat, Akun; liquid glass; berada 16px dari bawah; item aktif memakai latar var(--w) 30%; item padding 12 x 16.
- Kartu menu (.mc): foto penuh dengan fade blur di tepi atas dan bawah, nama di bawah, tag harga liquid glass. Status Habis: abu-abu, tidak bisa ditambah. Tahan kartu sekitar 0,5 detik membuka sheet. Tinggi foto bervariasi (masonry), sumber foto per menu: slot foto/<slug-nama>.jpg dengan gradien sebagai cadangan.
- Sheet liquid glass: dipakai untuk tandai habis, rentang waktu, Tampilan. Latar belakang dikaburkan gelap.
- Toast: pil liquid glass, hilang sendiri, tanpa dialog tambahan.
- Dialog konfirmasi: tombol aman (Batal) berwarna lime, tombol berbahaya (Hapus) berwarna danger tanpa fill.
- Baris riwayat (.rw): nama dan jumlah item di kiri, nominal dan jam di kanan, dikelompokkan per tanggal (.dh2).
- Kartu profil kasir (.pc): avatar bulat dengan inisial, nama di bawah; yang terpilih memakai outline 3px var(--ring) offset 4px; kartu terakhir bertanda plus untuk Tambah kasir.
- Kolom isian (.fld) dan baris pilihan (.op dengan tanda centang).

## 10. Layar tablet (acuan: bagian nomor di HTML)

Ikuti HTML untuk tata letak rinci. Perilaku yang tertulis di HTML:

- 0 Intro: wordmark Tati’e Kitchen, huruf masuk satu per satu (jeda 0,03 detik per huruf), satu kilap, lalu memudar. Total sekitar 1,25 detik, lalu lanjut ke Pilih profil. Dengan reduced-motion cukup 0,7 detik tanpa animasi.
- 1 Pilih profil kasir: judul Siapa yang bertugas? Tanpa password. Tanda plus menambah nama baru. Muncul setelah intro dan saat ganti kasir.
- 2 Home: bagian atas tanpa glass; foto fade blur; tahan kartu untuk tandai habis; tombol Menu lengkap di kanan atas.
- 2b sampai 2f: sheet tandai habis, batalkan, tandai tersedia, toast hilang sendiri.
- 2c dan 2d Menu lengkap (tampilan pembeli): kasir menyerahkan tablet ke pembeli. Terlaris di kotak sorot paling atas (Golden Triangle). Maksimal 7 item per kelompok. Harga di bawah nama dan lebih besar dari nama. Tanpa garis titik. Ikon di kiri tiap kelompok. Ukuran teks bertingkat (Terlaris paling besar). Satu foto saja. Menu habis abu-abu. Kategori dipilih dari chip di bawah judul: Semua, Makanan, Mie, Snack, Minuman. Kelompok minuman dipecah agar tiap kelompok maksimal 7 item.
- 3 Nomor meja dan bayar tunai: kasir menanyakan nomor meja, lalu memilih uang diterima. Kembalian tampil besar.
- 4 Struk: urutan baca status, lalu simpan atau bagikan, lalu pesanan baru. Satu tombol lime per layar.
- 5 dan 5b Riwayat: transaksi hari ini; rentang waktu di bagian atas membuka sheet (Hari ini, Kemarin, 7 hari terakhir, 30 hari terakhir, Pilih tanggal, tombol Terapkan).
- 6 dan 6b Akun: ganti kasir membuka Pilih profil; tombol Tampilan membuka sheet tema dan warna, latar mengabur, berlaku untuk semua layar.

## 11. Bahasa dan format

- Seluruh teks antarmuka bahasa Indonesia baku (PUEBI), singkat.
- Uang: Rp80.000 (titik ribuan, tanpa spasi). Di database disimpan integer rupiah.
- Jam: 10.01 (titik pemisah) diikuti zona waktu toko. HTML memakai WIB; toko ada di Makassar (WITA). Zona waktu diambil dari pengaturan toko, jangan ditulis mati.
- Tanggal pendek: 21 Okt 2026.

## 12. Aksesibilitas

- Kontras sesuai bagian 2. Cek di mode terang dan gelap untuk semua enam palet.
- Fokus terlihat memakai var(--ring).
- Setiap elemen yang bisa diketuk punya role dan nama yang jelas; target sentuh minimal 44.

## 13. Audit otomatis

HTML punya audit yang memeriksa semua teks hanya memakai tujuh pasangan ukuran. Bangun versi uji otomatis (Playwright) yang memeriksa: pasangan font-size/line-height, bobot, dan kelipatan 4 untuk padding, margin, gap, dan tinggi kontrol. Uji gagal jika ada pelanggaran.
