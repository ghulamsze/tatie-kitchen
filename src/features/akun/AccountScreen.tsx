import React, { useState, useRef, useEffect } from 'react';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { AppearanceSheet } from './AppearanceSheet.tsx';
import { PrinterSheet } from './PrinterSheet.tsx';
import { CropProfileDialog } from './CropProfileDialog.tsx';
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

  // State untuk Crop Foto 1:1 dan Konfirmasi Hapus Foto
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isConfirmDeletePhotoOpen, setIsConfirmDeletePhotoOpen] = useState(false);
  const [canConfirmDeletePhoto, setCanConfirmDeletePhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didTriggerHoldRef = useRef(false);

  const cashierName = activeCashier?.name || 'Robertus Amaresi';
  const cashierId = activeCashier?.id || '1d83083c-9d75-4dec-9c1a-75be69bc1050';
  const avatarUrl = activeCashier?.avatar_url;

  // Guard delay agar tombol konfirmasi hapus tidak langsung ketekan
  useEffect(() => {
    if (!isConfirmDeletePhotoOpen) {
      setCanConfirmDeletePhoto(false);
      return undefined;
    }
    setCanConfirmDeletePhoto(false);
    const timer = setTimeout(() => setCanConfirmDeletePhoto(true), 320);
    return () => clearTimeout(timer);
  }, [isConfirmDeletePhotoOpen]);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handlePointerDownAvatar = () => {
    didTriggerHoldRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      didTriggerHoldRef.current = true;
      setIsPreviewOpen(true);
    }, 450);
  };

  const handlePointerUpAvatar = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleAvatarClick = () => {
    if (didTriggerHoldRef.current) {
      didTriggerHoldRef.current = false;
      return;
    }
    if (avatarUrl) {
      setIsPhotoMenuOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Buka dialog Crop 1:1 sebelum disimpan ke database
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setIsCropOpen(true);

    // Reset file input agar bisa memilih ulang berkas yang sama
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setIsUploading(true);
      await updateCashierAvatar(cashierId, croppedBlob);
    } catch {
      // ignore
    } finally {
      setIsUploading(false);
      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc(null);
      }
    }
  };

  const handleDeletePhotoConfirm = async () => {
    if (!canConfirmDeletePhoto) return;
    setIsConfirmDeletePhotoOpen(false);
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
            onPointerDown={handlePointerDownAvatar}
            onPointerUp={handlePointerUpAvatar}
            onPointerLeave={handlePointerUpAvatar}
            onPointerCancel={handlePointerUpAvatar}
            role="button"
            tabIndex={0}
            aria-label="Pilihan foto profil kasir (Tahan untuk melihat)"
            title={avatarUrl ? "Klik untuk pilihan foto, tahan untuk melihat pratinjau" : "Klik untuk memilih foto profil baru"}
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
                draggable={false}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            {/* Pelindung transparan agar foto profil tidak bisa disalin atau diambil dengan hold */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
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

          <Button
            variant="danger"
            size="md"
            onClick={() => {
              setIsPhotoMenuOpen(false);
              setIsConfirmDeletePhotoOpen(true);
            }}
            style={{ width: '100%', height: '48px', justifyContent: 'center' }}
          >
            Hapus Profil
          </Button>

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

      {/* Dialog Konfirmasi Hapus Foto Profil (Dilengkapi Delay Guard agar Tombol Tidak Seperti Ketekan) */}
      <Dialog
        isOpen={isConfirmDeletePhotoOpen}
        onClose={() => setIsConfirmDeletePhotoOpen(false)}
        title="Hapus foto profil?"
        description={`Hapus foto profil kasir "${cashierName}" dan kembali ke inisial nama?`}
      >
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <Button
            variant="flat"
            size="md"
            onClick={() => setIsConfirmDeletePhotoOpen(false)}
            style={{ flex: 1, height: '44px' }}
          >
            Batal
          </Button>
          <button
            type="button"
            onClick={handleDeletePhotoConfirm}
            disabled={!canConfirmDeletePhoto}
            style={{
              flex: 1,
              height: '44px',
              borderRadius: 'var(--r-md)',
              background: 'var(--danger)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: 'var(--t-sm)',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.45)',
              cursor: canConfirmDeletePhoto ? 'pointer' : 'not-allowed',
              opacity: canConfirmDeletePhoto ? 1 : 0.6,
              pointerEvents: canConfirmDeletePhoto ? 'auto' : 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              transition: 'opacity 0.15s ease, transform 0.1s ease',
            }}
          >
            Hapus Foto
          </button>
        </div>
      </Dialog>

      {/* Lightbox Modal Lihat Foto Profil */}
      <Dialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Foto Profil Kasir"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
          <div
            style={{
              width: '260px',
              height: '260px',
              borderRadius: 'var(--r-xl)',
              overflow: 'hidden',
              background: 'var(--ctl)',
              border: '1px solid var(--ctl-line)',
              boxShadow: 'var(--sh-md)',
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <span
              style={{
                position: 'absolute',
                fontSize: '64px',
                fontWeight: 800,
                color: 'var(--ink-2)',
                zIndex: 0,
                userSelect: 'none',
              }}
            >
              {getInitials(cashierName)}
            </span>
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={cashierName}
                draggable={false}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  zIndex: 1,
                  animation: 'tk-photo-zoom-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
              />
            )}
            {/* Pelindung transparan lightbox agar tidak bisa disalin/diambil dengan hold */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />

            {/* Icon sunting (liquid glass) di ujung bawah kanan di dalam border foto profil */}
            <button
              type="button"
              onClick={() => {
                setIsPreviewOpen(false);
                fileInputRef.current?.click();
              }}
              aria-label="Sunting foto profil"
              title="Sunting foto profil"
              className="g-liquid"
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                width: '38px',
                height: '38px',
                borderRadius: 'var(--r-pill)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 5,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                color: 'var(--ink)',
                background: 'color-mix(in srgb, var(--acrylic-bg) 75%, transparent)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                transition: 'transform 0.1s ease',
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
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

      {/* Dialog Crop Foto 1:1 Resolusi Tetap 512x512 */}
      <CropProfileDialog
        isOpen={isCropOpen}
        imageSrc={cropImageSrc}
        onClose={() => {
          setIsCropOpen(false);
          if (cropImageSrc) {
            URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null);
          }
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
});
