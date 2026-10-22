# design.md Tatie Kitchen

**Sumber kebenaran visual: kode yang dibangun (src/).** Dibangun ulang dari kode nyata, 22 Oktober 2026.
Reference HTML adalah sejarah, bukan sumber kebenaran.
Cakupan fase sekarang: tablet kasir, landscape 1024 x 640.

---

## 1. Prinsip

- Satu sumber kebenaran: semua layar memakai token dari `src/design/tokens.css`.
- Konsisten di atas segalanya: skala teks, grid, bentuk, material, prioritas highlight.
- Satu tombol lime per layar. Aturan ini dipatuhi di semua layar.
- Hormati prefers-reduced-motion dan prefers-reduced-transparency.

---

## 2. Teks

Font: Plus Jakarta Sans, lokal via @fontsource (500, 700, 800). Fallback: system-ui.
Tujuh pasangan valid (src/design/tokens.css baris 12-26):

| Token    | Ukuran | LH  | Penggunaan nyata                                       |
|----------|--------|-----|--------------------------------------------------------|
| --t-xs   | 12px   | 16px| label tanggal, badge jam, isi struk                   |
| --t-sm   | 14px   | 20px| chip, navbar, baris keranjang, toast, catatan          |
| --t-md   | 16px   | 24px| body, tombol, baris riwayat, keypad                    |
| --t-lg   | 20px   | 28px| judul panel h3, kembalian struk                        |
| --t-xl   | 32px   | 40px| judul layar h2, total Home                             |
| --t-2xl  | 44px   | 52px| total tagihan Bayar, avatar kasir Akun                 |
| --t-3xl  | 64px   | 72px| intro wordmark, nomor meja Bayar                       |

Bobot yang diizinkan: 500, 700, 800.
Bobot 600 ditemukan di satu tempat (pelanggaran - lihat Bagian 14).
Teks >=24px: kontras minimal 3:1. Teks <24px: minimal 4.5:1.

---

## 3. Grid dan Kontrol

- Padding, margin, gap, lebar, tinggi: kelipatan 4.
- Tinggi kontrol: --c-sm=40px, --c-md=48px, --c-lg=56px.
- Target sentuh minimal 44px.
- Tombol lime/flat default height 56px (--c-lg), varian size=md: 48px.

---

## 4. Bentuk

| Token    | Nilai  | Dipakai untuk                                      |
|----------|--------|----------------------------------------------------|
| --r-sm   | 12px   | kotak ikon grup, badge meja di riwayat             |
| --r-md   | 16px   | tombol, input, baris pilihan, keypad               |
| --r-lg   | 24px   | panel acrylic, kartu grup menu, panel riwayat      |
| --r-xl   | 32px   | sheet, dialog, avatar kasir, kartu struk           |
| --r-pill | 9999px | chip, navbar pil, toast, banner offline            |

---

## 5. Material

### 5.1 Liquid Glass (.g-liquid) - tokens.css baris 418-429
- Background: linear-gradient(135deg, rgba(255,255,255,0.15) -> 0.03 -> 0.08) + rgb(var(--tint)/(a-tint-0.12))
- Backdrop: blur(24px) saturate(190%) brightness(1.06)
- Border: 1px solid rgba(255,255,255,0.16)
- Shadow: inset 0 1px 0 rgba(255,255,255,0.38), 0 16px 44px rgb(var(--sh)/0.4)
- ::before: radial-gradient spekuler
- Dipakai: navbar, tag harga, badge meja, AppearanceSheet, dialog offline

### 5.2 Frosted Acrylic (.g-acrylic) - tokens.css baris 443-454
- Background: linear-gradient(180deg, rgba(255,255,255,0.06), 0.01) + rgb(var(--tint)/a-tint)
- Backdrop: blur(28px) saturate(175%) brightness(1.03)
- Border: 1px solid rgba(255,255,255,0.09)
- Border-radius default: var(--r-lg) = 24px
- Highlight (.g-acrylic.hi): border aksen 55%, background aksen 26% - ada di CSS, belum dipakai di layar
- Dipakai: panel keranjang, panel bayar, kartu Akun, panel riwayat

### 5.3 Kontrol Datar (.ctl-flat) - tokens.css baris 466-471
- Background: var(--ctl), border: 1px solid var(--ctl-line), tanpa blur
- Dipakai: baris pilihan sheet riwayat

### 5.4 Fallback Aksesibilitas
- prefers-reduced-transparency: background var(--solid), backdrop-filter none
- prefers-reduced-motion: semua durasi 0.01ms

---

## 6. Prioritas Highlight

1. Tombol lime (satu per layar)
2. Kartu aksen (.g-acrylic.hi) - ada di CSS, belum dipakai
3. Liquid glass
4. Frosted acrylic
5. Datar

---

## 7. Tema dan Palet

Storage keys: tk-theme (system|light|dark; default: dark), tk-pal (default: netflix)
Diterapkan: data-theme dan data-palette di document.documentElement
Responsif sistem: matchMedia('prefers-color-scheme: light') didengarkan
File: src/design/theme.ts

Enam palet (nilai aktual dari tokens.css):

| Palet    | bg gelap | scr-bg gelap | accent gelap | bg terang | accent-ink terang |
|----------|----------|--------------|--------------|-----------|-------------------|
| netflix  | #141112  | #171314      | #d92b33      | #f4f2f1   | #b3121a           |
| mono     | #0b0b0c  | #0f0f10      | #f5f5f5      | #f6f6f6   | #111112            |
| hijau    | #04201f  | #04201f      | #c6f36a      | #eef6f1   | #17653a            |
| samudra  | #051428  | #061a33      | #ffd166      | #eaf2fb   | #7a5000            |
| senja    | #1f0b0e  | #2a0f12      | #8af0cf      | #fbf0eb   | #0b6b52            |
| blush    | #1d1015  | #24121a      | #f4a3b7      | #fbeff1   | #a3304f            |

Semua token per palet: --bg, --fg, --mut, --scr-bg, --b1, --b2, --b3, --ink, --ink-2, --ink-3,
--w, --hl, --sh, --tint, --a-tint, --accent, --on-accent, --accent-ink, --ring, --danger,
--fl-bg, --ov, --mc-bg, --chip-bg, --solid, --edge, --ctl, --ctl-line, --sel, --noise.
Token --hl, --w, --chip-bg, --edge, --sel, --noise tidak di-override per palet (mewarisi :root).
Token --danger hanya ada di netflix dan mono terang; palet lain mewarisi :root.

Swatch palet di AppearanceSheet: bulatan 44x44px, linear-gradient(135deg, darkBg 50%, accent 50%).
Tanpa label teks. Terpilih: outline 2px solid var(--ring), offset 2px.

---

## 8. Latar Layar

Kelas .scr + ::before pseudo-element:
- Background: var(--scr-bg)
- ::before: 3 radial-gradient (b1 kiri-atas 14%/10%, b2 tengah-bawah 55%/92%, b3 kanan-bawah 95%/78%)
  inset: -12%, filter: blur(26px). Konten di z-index: 1.

Dalam SwipePager: .scr background: transparent !important, ::before disembunyikan.
Global background dari .tk-global-bg + .tk-global-bg-bubbles satu lapisan di belakang semua halaman.

---

## 9. Komponen

### 9.1 Button (src/design/components/Button.tsx)
Props: variant (lime|flat|danger), size (md|lg), fullWidth.
- lime: .tk-btn-lime - h 56px, padding 0 24px, radius 16px, bg --accent, warna --on-accent,
  bobot 700, shadow inset putih 60%. Pressed: scale(0.98). Disabled: opacity 0.5.
  Focus-visible: outline 2px solid --ring.
- flat: .tk-btn-flat - h 56px, bg --ctl, border --ctl-line.
- danger: .tk-btn-flat.tk-btn-danger - warna --danger, border color-mix(danger 55%, transparent).
- size=md: .tk-btn-md - h 48px.

### 9.2 Chip (src/design/components/Chip.tsx)
.tk-chip: h 40px, padding 0 20px, radius --r-pill, bg --chip-bg, bobot 700, font --t-sm/--l-sm.
Aktif (.active / .lime): bg --accent, warna --on-accent.

### 9.3 Panel (src/design/components/Panel.tsx)
.tk-panel: padding 24px, radius --r-lg.

### 9.4 Overlay + Sheet (src/design/components/Sheet.tsx)
Overlay (.tk-overlay): position absolute; inset 0; z-index 100; bg var(--ov); backdrop blur(7px).
Sheet (.tk-sheet): position absolute; z-index 101; left 50%; bottom 24px; translateX(-50%);
  width min(520px, 100%-32px); padding 24px; radius --r-xl(32px); gap 16px. Material: liquid glass.
Dialog (.tk-dialog): position relative; z-index 101; width min(440px, 100%-32px).
  Varian w-wide: min(640px, 100%-32px).

### 9.5 Toast (src/design/components/Toast.tsx)
.tk-toast: position absolute; left 50%; bottom 32px; translateX(-50%); z-index 200;
  padding 12px 24px; radius --r-pill; font --t-sm/--l-sm; bobot 700. Material: liquid glass.
  Animasi tk-toast-in: 0.3s (slide up 16px + fade in) cubic-bezier(0.2,0.7,0.2,1).
Ikon (.tk-toast-icon): 24x24px, bulat, bg --accent, warna --on-accent. Danger: bg --danger, #ffffff hardcoded.

### 9.6 InputField (src/design/components/InputField.tsx)
.tk-field: h 48px, radius 16px, border --ctl-line, bg --ctl, padding 0 16px, font --t-sm/--l-sm.
  Focus: border --ring, shadow 0 0 0 2px color-mix(ring 35%, transparent). Error: border --danger.
.tk-input: serupa, tanpa appearance bawaan browser. Dipakai untuk search dan catatan.

### 9.7 OptionRow (src/design/components/OptionRow.tsx)
.tk-option: h 48px, padding 0 16px, radius 16px, bg --ctl, border --ctl-line,
  font --t-md/--l-md, bobot 700. Aktif: bg --sel, shadow inset 0 0 0 2px --ring.

### 9.8 NavbarPill (src/design/components/NavbarPill.tsx)
.tk-navbar: position absolute; left 50%; bottom 16px; translateX(-50%); padding 4px;
  radius --r-pill; z-index 50. Material: liquid glass.
Tiga item: Home, Riwayat, Akun.
Indikator elastis (.tk-nav-elastic-indicator): posisi dari offsetLeft+offsetWidth tab.
  Animasi 220ms cubic-bezier(0,0,0.2,1). Saat drag: no transition.
Item (.tk-navbar-item): h 40px, padding 0 22px, font --t-sm/--l-sm, bobot 700.
  Aktif: warna #ffffff hardcoded + text-shadow. (Pelanggaran hardcoded)
isBlocked: opacity 0.45, filter blur(3px), pointer-events none.
ResizeObserver mengukur ulang tab saat resize.

### 9.9 NoInternetNotice (src/design/components/NoInternetNotice.tsx)
Varian banner (role=alert): .tk-no-internet-banner - h 44px, padding 0 16px, radius --r-pill,
  bg color-mix(danger 30%, tint/0.6), border danger 60%, font --t-sm.
  Dot 10x10px + teks "Koneksi terputus. Mode offline" + tombol "Coba lagi" (inline style).
Varian dialog: overlay + dialog liquid glass + heading --t-lg + paragraf --t-sm + flat+lime.

### 9.10 Kartu Menu (src/features/home/MenuCard.tsx)
.tk-menu-card: radius --r-md(16px); overflow hidden; min-height 136px; display flex;
  flex-direction column; justify-content flex-end; padding 16px; cursor pointer.
  Shadow: 0 4px 16px rgba(0,0,0,0.35).
  Pressed: scale(0.94). Unavailable: grayscale(1) opacity 0.5. Hold: scale(1.05).
Photo-layer: foto atau gradien HSL dari item.hue. Blur-layer di tengah.
Tag harga (.price-tag): liquid glass, kanan atas, --t-sm/--l-sm, bobot 700, radius --r-pill.
Hold animasi: SVG ring 0.5 detik, stroke putih + glow aksen.

### 9.11 Kartu Profil Kasir (.tk-cashier-card)
Width 192px, column, gap 16px, font --t-md, bobot 700. Pressed: scale(0.96).
Avatar (.tk-avatar-box): 152x152px, radius --r-xl(32px), font --t-2xl/--l-2xl, bobot 800.
Terpilih: box-shadow 0 0 0 3px --ring. Kartu terakhir: ikon + untuk tambah kasir.

### 9.12 Tombol Tampilan (.tk-btn-appearance)
H 48px, padding 0 16px, radius --r-pill, bg --ctl, border --ctl-line, font --t-sm/--l-sm, bobot 700.
Dot warna 16x16px (--accent) + teks + panah.

### 9.13 Panel Keranjang (.tk-cart-panel)
Width 320px, padding 20px, gap 12px, flex: none.
Baris (.tk-cart-row): padding 10px 0, border-bottom 1px solid rgba(255,255,255,0.08).
Animasi masuk: tk-cart-item-in 0.32s cubic-bezier(0.34,1.56,0.64,1).
Animasi hapus (.tk-thanos-snap-out): tk-thanos-snap 0.3s - skew+blur+dissolve.
Tombol qty (.tk-qty-btn): 30x30px (override 32x32 di HomeScreen), bulat.

### 9.14 Keypad Meja (.tk-table-keypad-panel)
Width 360px, padding 20px, gap 12px.
Display meja (.tk-table-display): font --t-3xl tapi di-override inline ke 56px - pelanggaran.
Grid keypad 3x4: h 52px, radius --r-md, font --t-lg.

### 9.15 Quick Cash (.tk-quick-cash-grid)
Grid 2 kolom, gap 12px. Tombol: h 68px, radius --r-md, font --t-lg.
Terpilih: bg --sel, border --ring, shadow inset.

### 9.16 Struk (.tk-receipt-card)
Width 300px, bg #fbfaf5 hardcoded, warna #1f1e1d hardcoded.
Font: ui-monospace (disengaja untuk efek kertas thermal). Font-size 14px (bukan token). Radius 6px (bukan token).
Mesin struk: ::before 320x10px, gradien hitam.
Animasi: tk-receipt-feed-out 0.85s cubic-bezier(0.2,0.8,0.25,1).
Ikon centang 56px: tk-check-circle + tk-check-draw.

### 9.17 Menu Lengkap Pembeli
.tk-customer-menu-overlay: position absolute; inset 0; z-index 80; bg var(--scr-bg).
Grid 3 kolom (.tk-customer-menu-grid), gap 16px.
Kotak highlight (.tk-highlight-box): grid-column 1/-1, gap 20px, padding 20px.
Item menu (.tk-customer-menu-item): bullet berlian clip-path polygon, garis bawah gradient.
Kotak ikon (.tk-menu-icon-box): 40x40px, radius --r-sm(12px), bg color-mix(accent 24%, transparent).

### 9.18 Riwayat
Header tanggal (.tk-history-date-header): bg rgb(var(--w)/0.1), warna --ink-3, padding 8px 16px,
  font --t-xs/--l-xs, bobot 700.
Baris (.tk-history-row): padding 12px 16px, border-bottom 1px solid rgb(var(--w)/0.16),
  font --t-md/--l-md. Badge meja: liquid glass, radius --r-sm, padding 2px 8px.

### 9.19 Swipe Pager
.tk-swipe-pager-container: overflow hidden; touch-action pan-y.
.tk-swipe-pager-track: flex row, will-change transform.
.tk-swipe-page: flex 0 0 100%; overflow-y hidden.

---

## 10. Layar Tablet

Semua layar: width 1024px; height 640px; box-sizing border-box; position relative.

### 10.1 Intro (src/features/intro/IntroScreen.tsx)
- Wordmark per huruf dengan CSS --i untuk stagger. Font --t-3xl/--l-3xl, bobot 800.
- Animasi masuk: tk-iin 0.45s per huruf (opacity+translateY+blur).
- Animasi kilap: tk-igl 0.5s (gradient sweep).
- Animasi keluar: tk-iout 0.4s delay 0.85s (opacity+scale+blur).
- Total: 1250ms normal, 700ms reduced-motion (animasi nonaktif).
- Klik/Enter/Space: langsung finish. Hint "Ketuk untuk melanjutkan" di bawah.

### 10.2 Pilih Profil Kasir (src/features/profil/SelectCashierScreen.tsx)
- Judul "Siapa yang bertugas?" (--t-xl/--l-xl, bobot 800).
- Flex wrap gap 28px. Avatar liquid glass 152x152px.
- Tahan 550ms: dialog hapus kasir. Kartu + untuk tambah kasir.
- Tombol "Masuk Perangkat" tersembunyi kanan bawah (handler belum diimplementasi).
- Tidak ada password untuk memilih kasir.

### 10.3 Home (src/features/home/HomeScreen.tsx)
Layout: padding 20px 24px 84px 24px. Flex row gap 20px.
Kiri (flex: 1): header brand+btn Menu lengkap, search 42px, chip kategori, grid menu 3 kolom.
  Empty state: teks --ink-3.
Kanan (320px, g-acrylic): header "Pesanan baru"+btn Kosongkan, daftar qty+animasi,
  catatan 38px, total --t-xl bobot 800, tombol lime h48px (pelanggaran).
Toast: bottom 88px.

### 10.4 Menu Lengkap Pembeli (src/features/menu-lengkap/CustomerMenuView.tsx)
Overlay z-80, bg var(--scr-bg). Header+chip kategori.
Kotak Terlaris (TOP_SELLERS_DEFAULT) di atas.
Grid 3 kolom kartu grup menu (min-height 240px, radius --r-lg).
Data dari katalog statis MENU_GROUPS_CATALOG (bukan Supabase langsung).
Minuman dipecah kelompok <=7 item. Harga dari menuStore.items (fallback defaultPrice).

### 10.5 Bayar (src/features/bayar/PaymentScreen.tsx)
Layout: padding 20px, gap 16px. Flex row.
Panel kiri (g-acrylic, 360px): btn Kembali, keypad meja 3x4 (maks 2 digit, maks 15),
  display 56px hardcoded.
Panel kanan (g-acrylic, flex 1): chip metode (Tunai/QRIS/Transfer bank),
  total --t-2xl, quick-cash grid, input manual h68px, field kembalian h52px.
  QRIS: placeholder SVG. Transfer: nomor BCA hardcoded.
  Error: --t-sm --danger bobot 700. Tombol lime h48px.
RPC create_order (timeout 1200ms). Fallback lokal. Idempoten via client-generated ID.

### 10.6 Struk (src/features/struk/ReceiptScreen.tsx)
Layout: center, padding 24px 32px 84px 32px, gap 40px.
Kiri: mesin struk (::before 320x10px) + kartu monospace animasi tk-receipt-feed-out.
  Isi: nama toko, alamat "Jl. Tamalate 2 No. 8, Makassar" hardcoded, waktu, kasir,
  meja, no. struk, daftar item, catatan, total, tunai, kembalian.
  Share: Web Share API (fallback clipboard). Unduh: html-to-image toPng.
Kanan (g-acrylic, 360px, radius --r-xl): ikon centang animated, judul, kembalian,
  btn Bagikan, btn Unduh PNG, btn lime "Pesanan baru" h52px.
Audio: playPaymentSound() saat mount.

### 10.7 Riwayat (src/features/riwayat/HistoryScreen.tsx)
Layout: padding 20px 24px 84px 24px. Flex column.
Header: judul --t-xl + btn flat "Rentang" h40px.
Panel g-acrylic, overflow-y auto, radius --r-lg. Grouped per tanggal.
Preset: Hari ini, Kemarin, 7 hari, 30 hari, Semua waktu.
Pilih tanggal kustom belum diimplementasi. Filter pakai timezone device bukan toko.
Klik baris: sheet rincian struk.

### 10.8 Akun (src/features/akun/AccountScreen.tsx)
Layout: center, padding-bottom 92px (pelanggaran: bukan kelipatan 4).
Panel acrylic 420px, padding 36px 44px.
Avatar liquid glass 112x112px, radius --r-xl, font --t-xl, bobot 800.
Nama --t-lg + jam bertugas --t-sm. Btn Tampilan (AppearanceSheet). Btn flat Ganti kasir.
AppearanceSheet: overlay liquid glass, mode Sistem/Terang/Gelap, swatch 6 palet, btn lime Selesai.

---

## 11. Bahasa dan Format

- Teks: bahasa Indonesia baku (PUEBI), singkat.
- Uang: Rp80.000 - Rp langsung angka, titik ribuan, tanpa spasi. Integer rupiah di DB.
- Jam: 10.01 WITA - titik pemisah, zona waktu dari Intl.DateTimeFormat().resolvedOptions().timeZone
  (fallback Asia/Makassar = WITA). Fungsi formatTime() di src/lib/format/formatters.ts.
- Tanggal: 21 Okt 2026 via Intl.DateTimeFormat('id-ID', {day, month:'short', year}).
- Filter "Hari ini"/"Kemarin": memakai timezone device bukan toko - risiko inkonsistensi.

---

## 12. Aksesibilitas

Diimplementasi:
- prefers-reduced-motion: semua animasi 0.01ms.
- prefers-reduced-transparency: blur hilang, warna solid.
- Focus ring: outline 2px solid var(--ring) pada tombol, input, OptionRow.
- user-select: nonaktif global kecuali input/textarea.
- aria-label pada kartu kasir, kartu menu, tombol qty, input.
- aria-current=page pada item navbar aktif.
- role=alert pada banner offline.
- role=dialog aria-modal=true pada sheet AppearanceSheet dan dialog NoInternet.

Belum diimplementasi:
- Skip-to-main-content.
- Audit kontras otomatis semua palet.
- Tombol navbar height 40px - di bawah target 44px.

---

## 13. Animasi

| Nama                | Durasi       | Easing                        | Komponen              |
|---------------------|--------------|-------------------------------|-----------------------|
| tk-iin              | 0.45s        | cubic-bezier(0.2,0.7,0.2,1)  | Intro huruf masuk     |
| tk-igl              | 0.5s         | ease-out                      | Intro kilap huruf     |
| tk-iout             | 0.4s d:0.85s | cubic-bezier(0.4,0,1,1)       | Intro wordmark keluar |
| tk-toast-in         | 0.3s         | cubic-bezier(0.2,0.7,0.2,1)  | Toast masuk           |
| tk-cart-item-in     | 0.32s        | cubic-bezier(0.34,1.56,0.64,1)| Item keranjang masuk  |
| tk-thanos-snap      | 0.3s         | cubic-bezier(0.25,1,0.5,1)   | Item keranjang keluar |
| tk-hold-spin        | 0.5s         | linear                        | Ring hold kartu menu  |
| tk-receipt-feed-out | 0.85s        | cubic-bezier(0.2,0.8,0.25,1) | Struk keluar mesin    |
| tk-check-circle     | 0.5s         | cubic-bezier(0.34,1.56,0.64,1)| Ikon centang muncul  |
| tk-check-draw       | 0.4s d:0.25s | ease-out                      | Centang tergambar     |
| Navbar indicator    | 220ms        | cubic-bezier(0,0,0.2,1)      | Pill indicator geser  |

---

## 14. Pelanggaran Aturan Desain (Status Perbaikan Fase 1)

1. [DIPERBAIKI] Judul Home 26px/32px -> diganti `var(--t-xl)` dan `var(--l-xl)`, bobot 800 (HomeScreen.tsx:121).
2. [DIPERBAIKI] Nomor meja 56px/64px -> inline override dihapus, memakai kelas `.tk-table-display` (`var(--t-3xl)`/`var(--l-3xl)`) (PaymentScreen.tsx:233).
3. [DIPERBAIKI] Bobot 600 pada label Total di Home -> diganti 700 (HomeScreen.tsx:416).
4. [DIPERBAIKI] Tombol lime Home height 48px override -> inline height dihapus, otomatis memakai `--c-lg` (56px) (HomeScreen.tsx:427).
5. [DIPERBAIKI] Tombol lime Bayar height 48px -> inline height dihapus, otomatis memakai `--c-lg` (56px) (PaymentScreen.tsx:448).
6. [DIPERBAIKI] color: #ffffff pada .tk-navbar-item.active -> diganti `var(--on-accent)` (components.css:374).
7. color: #ffffff hardcoded pada .tk-toast-icon.danger (components.css:217) - ikon kontras di atas bahaya.
8. [DIKECUALIKAN/DISENGAJA] Warna struk #fbfaf5, #1f1e1d, #999999, #666666, #555555, radius 6px (efek kertas fisik).
9. [DIKECUALIKAN/DISENGAJA] Font struk ui-monospace (efek cetak thermal).
10. [DIPERBAIKI] Min-height tombol Kosongkan 36px -> diubah menjadi min-height 44px (touch target compliant) (HomeScreen.tsx:278).
11. [DIPERBAIKI] Height search 42px -> diubah menjadi 44px (kelipatan 4 & touch target) (HomeScreen.tsx:148).
12. [DIPERBAIKI] Height notes 38px -> diubah menjadi 40px (kelipatan 4) (HomeScreen.tsx:378).
13. [DIPERBAIKI] padding-bottom 92px AccountScreen -> diubah menjadi 88px (kelipatan 4, 56px nav + 16px + 16px) (AccountScreen.tsx:30).
14. [DIPERBAIKI] font-weight 600 pada .tk-menu-group-item-price -> diubah menjadi 700 (components.css:1227).

---

## 15. Dalam Referensi Tapi Belum Dibangun

- Sheet konfirmasi tandai habis/tersedia (state 2b-2f): hold kartu ada di store, sheet belum.
- RPC set_item_availability belum dipanggil dari UI.
- Pilih tanggal kustom di sheet riwayat (kalender/date-picker).
- Kembalian besar di Bayar (referensi: --t-3xl terpisah; kode: field --t-lg biasa).
- Layar laptop admin (Home, Riwayat, Menu, Kasir, Laporan, Pengaturan, Akun, Cetak menu).
- Layar Android pemilik dan iOS pemilik.
- Fitur cetak menu (PDF/print).
- Device login flow (tombol "Masuk Perangkat" ada, handler belum).
- Antrean offline (outbox) - saat ini fallback lokal langsung.

---

## 16. Audit Otomatis

Ada: tokens.test.ts, components.test.tsx, tabletA.test.tsx, tabletB.test.tsx,
  supabase.test.ts, formatters.test.ts, e2e/ Playwright.

Belum ada:
- Playwright memverifikasi pasangan font-size/line-height semua palet (gelap+terang).
- Audit kelipatan 4 untuk padding/margin/gap/height kontrol.
- Audit kontras warna otomatis.
