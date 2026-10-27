import React, { useState, useRef } from 'react';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { AppearanceSheet } from './AppearanceSheet.tsx';
import { PrinterSheet } from './PrinterSheet.tsx';
import { Button } from '../../design/components/Button.tsx';
import { Dialog } from '../../design/components/Dialog.tsx';

export interface AccountScreenProps {
  onChangeCashier: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = React.memo(({ onChangeCashier }) => {
  const { activeCashier, shiftStartTime, updateCashierAvatar, deleteCashierAvatar } = useCashierStore();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cashierName = activeCashier?.name || 'Robertus Amaresi';
  const cashierId = activeCashier?.id || '1d83083c-9d75-4dec-9c1a-75be69bc1050';
  const avatarUrl = activeCashier?.avatar_url;

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleAvatarClick = () => {
    if (avatarUrl) {
      setIsPhotoMenuOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await updateCashierAvatar(cashierId, file);
    } catch {
      // ignore
    } finally {
      setIsUploading(false);
    }
    // Reset file input agar bisa pilih file yang sama jika diinginkan
    e.target.value = '';
  };

  const handleDeletePhoto = async () => {
    setIsPhotoMenuOpen(false);
    await deleteCashierAvatar(cashierId);
  };

  return (
    <div
      className="scr"
      style={{
        width: '1024px',
        height: '640px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: '88px', // Ruang untuk navbar pil di bawah (56px navbar + 16px bottom + 16px clearance)
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <div
        className="g-acrylic"
        style={{
          width: '420px',
          padding: '36px 44px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          textAlign: 'center',
        }}
      >
        {/* Avatar Kasir Aktif dengan Tombol Ubah Foto */}
        <div style={{ position: 'relative', width: '112px', height: '112px' }}>
          <div
            className="g-liquid"
            onClick={handleAvatarClick}
            role="button"
            tabIndex={0}
            aria-label="Pilihan foto profil kasir"
            title={avatarUrl ? "Klik untuk melihat atau mengubah foto profil" : "Klik untuk memilih foto profil baru"}
            style={{
              width: '112px',
              height: '112px',
              borderRadius: 'var(--r-xl)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 'var(--t-xl)',
              lineHeight: 'var(--l-xl)',
              fontWeight: 800,
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              opacity: isUploading ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            <span style={{ position: 'absolute', zIndex: 0, userSelect: 'none' }}>
              {getInitials(cashierName)}
            </span>
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={cashierName}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 1,
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>

          {/* Tombol Kamera Badge Kecil */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAvatarClick();
            }}
            aria-label="Kelola foto profil"
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--accent)',
              border: '2px solid var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--sh-sm)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--on-accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        {/* Nama dan Jam Tugas */}
        <div>
          <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', display: 'block' }}>
            {cashierName}
          </b>
          <span style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)' }}>
            Bertugas sejak {shiftStartTime}
          </span>
        </div>

        {/* Tombol Tampilan (Lebar) & Tombol Printer (Icon SVG Saja) */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
          <button
            type="button"
            className="tk-btn-appearance"
            onClick={() => setIsAppearanceOpen(true)}
            aria-haspopup="dialog"
            aria-label="Atur tampilan tema dan warna"
            style={{
              flex: 1,
              minWidth: 0,
              height: '48px',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="tk-dot-color" />
              <span>Tampilan</span>
            </span>
            <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>▾</span>
          </button>

          <button
            type="button"
            className="tk-btn-icon-circle"
            onClick={() => setIsPrinterOpen(true)}
            aria-haspopup="dialog"
            aria-label="Pengaturan printer thermal"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" rx="1" />
            </svg>
          </button>
        </div>

        {/* Tombol Ganti Kasir (Tinggi 48px Sama Persis dengan Tampilan & Printer) */}
        <Button
          variant="flat"
          size="md"
          onClick={onChangeCashier}
          style={{ width: '100%', height: '48px' }}
        >
          Ganti kasir
        </Button>

        {/* Versi Aplikasi */}
        <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)', marginTop: '2px' }}>
          v0.1.0
        </span>
      </div>

      {/* Sheet Tampilan Tema dan Warna */}
      <AppearanceSheet
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
      />

      {/* Sheet Pengaturan Printer Thermal Bluetooth */}
      <PrinterSheet
        isOpen={isPrinterOpen}
        onClose={() => setIsPrinterOpen(false)}
      />

      {/* Dialog Pilihan Foto Profil (Lihat, Ubah, Hapus) */}
      <Dialog
        isOpen={isPhotoMenuOpen}
        onClose={() => setIsPhotoMenuOpen(false)}
        title="Foto Profil"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          <Button
            variant="flat"
            size="md"
            onClick={() => {
              setIsPhotoMenuOpen(false);
              setIsPreviewOpen(true);
            }}
            style={{ width: '100%', height: '48px', justifyContent: 'center' }}
          >
            Lihat Profil
          </Button>

          <Button
            variant="flat"
            size="md"
            onClick={() => {
              setIsPhotoMenuOpen(false);
              fileInputRef.current?.click();
            }}
            style={{ width: '100%', height: '48px', justifyContent: 'center' }}
          >
            Pilih Foto Baru
          </Button>

          <button
            type="button"
            className="tk-btn-flat"
            onClick={handleDeletePhoto}
            style={{
              width: '100%',
              height: '48px',
              justifyContent: 'center',
              color: 'var(--danger)',
              borderColor: 'color-mix(in srgb, var(--danger) 35%, transparent)',
            }}
          >
            Hapus Profil
          </button>

          <Button
            variant="flat"
            size="md"
            onClick={() => setIsPhotoMenuOpen(false)}
            style={{ width: '100%', height: '44px', marginTop: '4px', opacity: 0.7 }}
          >
            Batal
          </Button>
        </div>
      </Dialog>

      {/* Lightbox Modal Lihat Foto Profil */}
      <Dialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Foto Profil Kasir"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
          {avatarUrl && (
            <div
              style={{
                width: '260px',
                height: '260px',
                borderRadius: 'var(--r-xl)',
                overflow: 'hidden',
                background: 'var(--ctl)',
                border: '1px solid var(--ctl-line)',
                boxShadow: 'var(--sh-md)',
              }}
            >
              <img
                src={avatarUrl}
                alt={cashierName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
          <b style={{ fontSize: 'var(--t-md)', color: 'var(--ink)' }}>{cashierName}</b>
          <Button
            variant="lime"
            size="md"
            onClick={() => setIsPreviewOpen(false)}
            style={{ width: '100%', height: '44px' }}
          >
            Tutup
          </Button>
        </div>
      </Dialog>
    </div>
  );
});
