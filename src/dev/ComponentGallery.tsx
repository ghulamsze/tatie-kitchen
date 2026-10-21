import React, { useState, useEffect } from 'react';
import {
  Button,
  Chip,
  Panel,
  Sheet,
  Dialog,
  Toast,
  InputField,
  OptionRow,
  NavbarPill,
  NavItem,
  NoInternetNotice,
} from '../design/components/index.ts';
import {
  ThemeMode,
  Palette,
  PALETTES,
  applyTheme,
  applyPalette,
  getStoredTheme,
  getStoredPalette,
} from '../design/theme.ts';

export const ComponentGallery: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(getStoredTheme);
  const [currentPalette, setCurrentPalette] = useState<Palette>(getStoredPalette);

  const [activeNavItem, setActiveNavItem] = useState<NavItem>('Home');
  const [chipSelected, setChipSelected] = useState<string>('Semua');
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isToastOpen, setIsToastOpen] = useState<boolean>(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<string>('Hari ini');

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    applyPalette(currentPalette);
  }, [currentPalette]);

  const handleThemeChange = (mode: ThemeMode) => {
    setCurrentTheme(mode);
    applyTheme(mode);
  };

  const handlePaletteChange = (palette: Palette) => {
    setCurrentPalette(palette);
    applyPalette(palette);
  };

  const triggerToast = () => {
    setIsToastOpen(true);
    setTimeout(() => {
      setIsToastOpen(false);
    }, 2500);
  };

  return (
    <div className="scr" style={{ minHeight: '100vh', padding: '32px 24px 80px' }}>
      {/* Header Galeri */}
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', fontWeight: 800, margin: '0 0 8px' }}>
              Galeri Komponen Tati’e Kitchen
            </h1>
            <p style={{ color: 'var(--mut)', margin: 0, fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)' }}>
              Mode Dev: Pengujian komponen dasar, sistem token 6 palet, tema terang/gelap, dan status No Internet.
            </p>
          </div>

          {/* Pengalih Tema & Palet */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '999px', background: 'var(--ctl)', border: '1px solid var(--ctl-line)' }}>
              {(['dark', 'light', 'system'] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleThemeChange(m)}
                  style={{
                    background: currentTheme === m ? 'var(--accent)' : 'transparent',
                    color: currentTheme === m ? 'var(--on-accent)' : 'var(--ink)',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '4px 12px',
                    fontSize: 'var(--t-xs)',
                    lineHeight: 'var(--l-xs)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {m === 'dark' ? 'Gelap' : m === 'light' ? 'Terang' : 'Sistem'}
                </button>
              ))}
            </div>

            {/* Swatch Palet */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePaletteChange(p.id)}
                  title={p.name}
                  aria-label={p.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: currentPalette === p.id ? '2px solid var(--ring)' : '1px solid rgb(var(--w) / 0.4)',
                    outlineOffset: '2px',
                    cursor: 'pointer',
                    background: `linear-gradient(135deg, ${p.darkBg} 50%, ${p.accent} 50%)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Offline Banner Live Preview */}
        {showOfflineBanner && (
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <NoInternetNotice
              variant="banner"
              onRetry={() => alert('Mencoba menyambungkan kembali ke server Supabase...')}
            />
          </div>
        )}

        {/* Section 1: Tombol */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800, margin: '0 0 16px' }}>
            1. Tombol (Tinggi 56px & 48px)
          </h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="lime">Tombol Utama Lime (P1)</Button>
            <Button variant="flat">Tombol Datar (P5)</Button>
            <Button variant="danger">Tombol Bahaya</Button>
            <Button variant="flat" size="md">Datar Sedang (48px)</Button>
            <Button variant="lime" disabled>Dinonaktifkan</Button>
          </div>
        </section>

        {/* Section 2: Chip Kategori */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800, margin: '0 0 16px' }}>
            2. Chip Kategori
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Semua', 'Makanan', 'Mie', 'Snack', 'Minuman'].map((cat) => (
              <Chip
                key={cat}
                active={chipSelected === cat}
                onClick={() => setChipSelected(cat)}
              >
                {cat}
              </Chip>
            ))}
          </div>
        </section>

        {/* Section 3: Panel Glass */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800, margin: '0 0 16px' }}>
            3. Panel Konten (Frosted Acrylic & Aksen Highlight)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Panel variant="acrylic">
              <h3 style={{ fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)', fontWeight: 800, margin: '0 0 8px' }}>
                Panel Frosted Acrylic Standar
              </h3>
              <p style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', margin: 0 }}>
                Menggunakan blur 32px, tint padat, tekstur noise halus, dan border edge 1px.
              </p>
            </Panel>

            <Panel variant="acrylic" highlight>
              <h3 style={{ fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)', fontWeight: 800, margin: '0 0 8px' }}>
                Panel Kartu Aksen (.hi)
              </h3>
              <p style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', margin: 0 }}>
                Dipakai untuk menyorot angka utama, total pendapatan, atau Terlaris Golden Triangle.
              </p>
            </Panel>
          </div>
        </section>

        {/* Section 4: Kolom Isian & Baris Pilihan */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800, margin: '0 0 16px' }}>
            4. Kolom Isian & Baris Pilihan
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <InputField placeholder="Cari nama menu..." defaultValue="Nasi Goreng Telur" />
              <InputField placeholder="Kolom error" error defaultValue="Format nomor meja tidak valid" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Hari ini', 'Kemarin', '7 hari terakhir'].map((opt) => (
                <OptionRow
                  key={opt}
                  label={opt}
                  active={selectedOption === opt}
                  onClick={() => setSelectedOption(opt)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Modal, Sheet, Toast & No Internet Controls */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800, margin: '0 0 16px' }}>
            5. Lapisan Melayang (Liquid Glass): Sheet, Dialog, Toast, & No Internet
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="flat" size="md" onClick={() => setIsSheetOpen(true)}>
              Buka Sheet Liquid Glass
            </Button>
            <Button variant="flat" size="md" onClick={() => setIsDialogOpen(true)}>
              Buka Dialog Konfirmasi
            </Button>
            <Button variant="flat" size="md" onClick={triggerToast}>
              Tampilkan Toast Selesai
            </Button>
            <Button
              variant="flat"
              size="md"
              onClick={() => setIsOfflineModalOpen(true)}
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              Buka Modal No Internet
            </Button>
            <Button
              variant="flat"
              size="md"
              onClick={() => setShowOfflineBanner((prev) => !prev)}
            >
              {showOfflineBanner ? 'Sembunyikan Banner Offline' : 'Tampilkan Banner Offline'}
            </Button>
          </div>
        </section>

        {/* Section 6: Navbar Pil Tablet */}
        <section style={{ position: 'relative', height: '100px', border: '1px dashed var(--ctl-line)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--ink-3)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)' }}>
            Posisi Navbar Pil (16px dari bawah layar tablet)
          </span>
          <NavbarPill activeItem={activeNavItem} onSelect={setActiveNavItem} />
        </section>
      </div>

      {/* Sheet Demo */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Tandai Status Menu"
      >
        <div style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)' }}>
          Kebab · Rp30.000 · Status saat ini: Tersedia
        </div>
        <Button variant="lime" onClick={() => setIsSheetOpen(false)}>
          Tandai habis
        </Button>
        <Button variant="flat" onClick={() => setIsSheetOpen(false)}>
          Batal
        </Button>
      </Sheet>

      {/* Dialog Demo */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Hapus Kasir Puspitawati?"
        description="Nama ini tidak muncul lagi di layar pilih profil. Transaksi yang sudah tercatat tidak ikut terhapus."
      >
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Button variant="danger" size="md" onClick={() => setIsDialogOpen(false)} style={{ flex: 1 }}>
            Hapus
          </Button>
          <Button variant="lime" size="md" onClick={() => setIsDialogOpen(false)} style={{ flex: 1 }}>
            Batal
          </Button>
        </div>
      </Dialog>

      {/* Toast Demo */}
      <Toast message="Perubahan status menu disimpan" visible={isToastOpen} />

      {/* No Internet Modal Demo */}
      {isOfflineModalOpen && (
        <NoInternetNotice
          variant="dialog"
          onRetry={() => {
            alert('Mencoba menyambungkan kembali...');
            setIsOfflineModalOpen(false);
          }}
          onDismiss={() => setIsOfflineModalOpen(false)}
        />
      )}
    </div>
  );
};
