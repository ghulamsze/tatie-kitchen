# design-diff.md Tatie Kitchen
# Perbedaan kode versus referensi, pelanggaran token, dan state yang hilang
# Dihasilkan 22 Oktober 2026 dari audit kode nyata

---

## A. Perbedaan Kode vs Referensi HTML

| # | Area           | Di Referensi HTML                                        | Di Kode Nyata                                                  | Keparahan |
|---|----------------|----------------------------------------------------------|----------------------------------------------------------------|-----------|
| 1 | Layar Bayar    | Kembalian ditampilkan dengan font --t-3xl di panel besar | Kembalian di field biasa tinggi 52px, font --t-lg              | Sedang    |
| 2 | Riwayat        | Preset "Pilih tanggal" (date-picker kustom)              | Preset "Semua waktu" menggantikan date-picker                  | Sedang    |
| 3 | Home header    | Judul pakai token (sekitar --t-xl)                       | 26px/32px hardcoded - bukan pasangan token valid               | Rendah    |
| 4 | Sheet tandai habis | Sheet konfirmasi (2b-2f) saat tahan kartu          | setHeldItem() tersimpan di store tapi sheet UI belum ada       | Tinggi    |
| 5 | Foto kartu menu| Foto slug per menu (foto/<slug>.jpg)                     | Foto lokal /assets/images/<kategori>/<nama>.webp + gradien HSL | Rendah    |
| 6 | Menu Lengkap   | Terlaris dari best_sellers (data real Supabase)          | TOP_SELLERS_DEFAULT (data statis hardcoded)                    | Sedang    |
| 7 | Bayar          | Nomor meja display font ~--t-3xl (64px)                  | 56px hardcoded (bukan token)                                   | Rendah    |
| 8 | Struk          | Kembalian Rp0 besar di bagian kanan                     | Kembalian kecil --t-sm di bawah judul                          | Rendah    |
| 9 | Device setup   | Tombol login tersembunyi untuk setup device              | Tombol ada, handler onOpenDeviceSetup belum diimplementasi     | Blocker   |
| 10| Navbar aktif   | Warna item aktif pakai token --on-accent atau --ink       | #ffffff hardcoded                                              | Rendah    |

---

## B. Pelanggaran Token Desain di Kode

| # | File                                    | Baris  | Nilai Ditemukan       | Nilai Seharusnya        | Jenis Pelanggaran     |
|---|-----------------------------------------|--------|-----------------------|-------------------------|-----------------------|
| 1 | src/features/home/HomeScreen.tsx        | 121    | 26px/32px (fontSize)  | var(--t-xl)/var(--l-xl) | Ukuran teks off-token |
| 2 | src/features/bayar/PaymentScreen.tsx    | 233-234| 56px/64px (fontSize)  | var(--t-3xl)/var(--l-3xl)| Ukuran teks off-token|
| 3 | src/features/home/HomeScreen.tsx        | 416    | fontWeight: 600       | 700 atau 500            | Bobot off-set         |
| 4 | src/features/home/HomeScreen.tsx        | 427    | height: 48px (lime)   | var(--c-lg) = 56px      | Tinggi kontrol override|
| 5 | src/features/bayar/PaymentScreen.tsx    | 448    | height: 48px (lime)   | var(--c-lg) = 56px      | Tinggi kontrol override|
| 6 | src/design/components.css               | 374    | color: #ffffff        | var(--on-accent) atau token| Warna hardcoded    |
| 7 | src/design/components.css               | 217    | color: #ffffff        | token warna             | Warna hardcoded       |
| 8 | src/features/struk/ReceiptScreen.tsx    | 119    | #fbfaf5               | token (disengaja)       | Warna hardcoded       |
| 9 | src/design/components.css               | 919    | #ffffff               | token                   | Warna hardcoded       |
| 10| src/features/home/HomeScreen.tsx        | 148    | height: 42px          | kelipatan 4 (40 atau 44)| Bukan kelipatan 4     |
| 11| src/features/home/HomeScreen.tsx        | 378    | height: 38px          | kelipatan 4 (36 atau 40)| Bukan kelipatan 4     |
| 12| src/features/akun/AccountScreen.tsx     | 30     | paddingBottom: 92px   | kelipatan 4 (88 atau 96)| Bukan kelipatan 4     |
| 13| src/design/components.css               | 1227   | font-weight: 600      | 700 atau 500            | Bobot off-set         |
| 14| src/features/home/HomeScreen.tsx        | 278    | minHeight: 36px       | minimal 44px            | Target sentuh kurang  |
| 15| src/design/components.css               | 806    | font-size: 16px inline| var(--t-md)             | Ukuran teks off-token |

---

## C. State yang Tidak Ada di Referensi Maupun Kode

| # | State                          | Layar Terdampak              | Dampak Nyata                                             |
|---|--------------------------------|------------------------------|----------------------------------------------------------|
| 1 | Tidak ada internet             | Home, Bayar, Riwayat, Intro  | Banner NoInternetNotice ada di komponen tapi belum diintegrasikan ke AppShell/TabletRoot |
| 2 | Loading menu dari Supabase     | Home                         | Tidak ada spinner/skeleton; menu langsung muncul dari store (seed lokal) |
| 3 | Loading kasir dari Supabase    | Pilih Profil                 | isLoading ada di cashierStore, tidak ditampilkan ke UI   |
| 4 | Error fetch menu               | Home                         | Tidak ada UI error state jika Supabase gagal             |
| 5 | Error fetch kasir              | Pilih Profil                 | Fallback ke DEFAULT_CASHIERS diam-diam, tanpa pesan      |
| 6 | Keranjang kosong saat bayar    | Bayar                        | Tombol lime di Home disabled jika kosong - OK, tapi bisa diakses via URL langsung |
| 7 | Session expired Supabase       | Semua                        | autoRefreshToken=true tapi tidak ada UI saat sesi gagal diperbarui |
| 8 | Sinkronisasi menu habis        | Home                         | Perubahan available di tablet lain tidak sync real-time (belum ada Realtime) |
| 9 | Foto menu gagal muat           | Home, Menu Lengkap           | Fallback ke gradien HSL - sudah ada, tidak perlu aksi    |
| 10| Meja sudah diisi (duplikat)   | Bayar                        | Validasi klien ada (maks 15, maks 2 digit), tapi tidak ada cek meja sedang dipakai |
| 11| Struk tanpa data order         | Struk                        | Fallback sample data - sudah ada, tapi tampak seperti data nyata |
| 12| Tidak ada kasir terdaftar     | Pilih Profil                 | DEFAULT_CASHIERS selalu ada, kondisi ini tidak mungkin   |
| 13| Pengaturan toko belum ada      | Semua                        | Tidak ada layar settings/toko; timezone, nama toko, rekening hardcoded |

---

## D. Baris di arsitektur.md dan SKILL.md yang Mengacu ke Referensi atau design.md Lama

### arsitektur.md
- Baris 10: "Gaya: CSS variables dari design.md (tanpa Tailwind)"
  Usulan: "Gaya: CSS variables dari src/design/tokens.css yang didokumentasikan di docs/design.md (tanpa Tailwind)"

- Baris 234: "Layar: setiap layar tablet cocok dengan HTML referensi (Playwright, viewport 1024x640, bandingkan visual)"
  Usulan: "Layar: setiap layar tablet cocok dengan docs/design.md (Playwright, viewport 1024x640, bandingkan visual). Reference HTML bisa dipakai sebagai pembanding sejarah."

### SKILL.md
- Baris 14: "reference/tati_e-kitchen-final-preview.html: tampilan dan perilaku. Menang untuk soal visual."
  Usulan: "docs/design.md (dibangun dari kode nyata): tampilan dan perilaku. Menang untuk soal visual."

- Baris 15: "docs/design.md: aturan desain yang diringkas dari HTML."
  Usulan: "docs/design.md: aturan desain yang dibangun ulang dari kode nyata. Ini sumber kebenaran visual."

- Baris 56: "Layar yang dikerjakan dibandingkan dengan HTML referensi pada viewport 1024x640 dan perbedaannya dijelaskan."
  Usulan: "Layar yang dikerjakan dibandingkan dengan docs/design.md pada viewport 1024x640 dan perbedaannya dijelaskan."

- Baris 57: "Audit desain lulus pada palet netflix terang dan gelap (semua enam palet pada fase uji beta)."
  Tetap relevan - tidak perlu diubah.
