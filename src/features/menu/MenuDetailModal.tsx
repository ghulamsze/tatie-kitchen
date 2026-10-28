import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MenuItem } from '../../lib/supabase/types.ts';
import { useMenuStore } from '../../stores/menuStore.ts';
import { PhotoActionsDialog } from '../../design/components/PhotoActionsDialog.tsx';
import { CropProfileDialog } from '../akun/CropProfileDialog.tsx';
import { CategoryDropdown } from './CategoryDropdown.tsx';
import {
  triggerHapticFeedback,
  triggerHapticDelete,
  triggerHapticReject,
} from '../../lib/device/haptics.ts';
import { registerBackHandler } from '../../lib/device/backButton.ts';

function formatThousands(value: number | string): string {
  // Hanya ambil digit angka dan buang leading zeros di awal (hanya menerima 1-9 di posisi awal)
  const digits = String(value).replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseThousands(value: string): number {
  const digits = String(value).replace(/\D/g, '').replace(/^0+/, '');
  return digits ? parseInt(digits, 10) : 0;
}

export interface MenuDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: (itemId: string) => void;
  onSaved?: (item: MenuItem) => void;
}

export const MenuDetailModal: React.FC<MenuDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onDeleted,
  onSaved,
}) => {
  const { groups, updateMenuItem, deleteMenuItem, toggleItemAvailability } = useMenuStore();

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [priceStr, setPriceStr] = useState('');
  const [available, setAvailable] = useState(true);
  const [groupId, setGroupId] = useState('');
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [canConfirmDelete, setCanConfirmDelete] = useState(false);
  const [isPhotoActionsOpen, setIsPhotoActionsOpen] = useState(false);
  const [isPreviewPhotoOpen, setIsPreviewPhotoOpen] = useState(false);
  const [isCropPhotoOpen, setIsCropPhotoOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [shakeField, setShakeField] = useState<'name' | 'price' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const photoHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didTriggerPhotoHoldRef = useRef(false);

  // Inisialisasi data form ketika modal dibuka
  useEffect(() => {
    if (isOpen && item) {
      setName(item.name || '');
      setPrice(item.price_idr || 0);
      setPriceStr(formatThousands(item.price_idr || 0));
      setAvailable(item.available ?? true);
      let gid = item.group_id || '';
      if (gid.startsWith('g-makanan')) gid = 'g-makanan';
      setGroupId(gid || (groups[0]?.id ?? 'g-makanan'));
      setPhotoPath(item.photo_path || null);
      setIsDeleteDialogOpen(false);
      setIsPhotoActionsOpen(false);
      setIsPreviewPhotoOpen(false);
      setIsCropPhotoOpen(false);
    }
  }, [isOpen, item, groups]);

  // Debounce safety delay 320ms untuk konfirmasi hapus menu (Konsisten dengan hapus kasir)
  useEffect(() => {
    if (!isDeleteDialogOpen) {
      setCanConfirmDelete(false);
      return undefined;
    }
    setCanConfirmDelete(false);
    const timer = setTimeout(() => setCanConfirmDelete(true), 320);
    return () => clearTimeout(timer);
  }, [isDeleteDialogOpen]);

  // Modal open classes
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('tk-modal-open');
      document.querySelector('.tk-tablet-root')?.classList.add('tk-has-modal');
    }
    return () => {
      document.body.classList.remove('tk-modal-open');
      document.querySelector('.tk-tablet-root')?.classList.remove('tk-has-modal');
    };
  }, [isOpen]);

  // Shake trigger
  const triggerShake = (field: 'name' | 'price') => {
    setShakeField(field);
    triggerHapticReject();
    setTimeout(() => {
      setShakeField(null);
    }, 600);
  };

  // Tutup dengan auto-save status ketersediaan
  const handleClose = useCallback(() => {
    if (item && available !== item.available) {
      toggleItemAvailability(item.id, available);
    }
    onClose();
  }, [item, available, toggleItemAvailability, onClose]);

  // Handle hardware / swipe back button
  useEffect(() => {
    if (!isOpen) return undefined;

    return registerBackHandler(() => {
      if (isCropPhotoOpen) {
        setIsCropPhotoOpen(false);
        if (cropImageSrc) {
          URL.revokeObjectURL(cropImageSrc);
          setCropImageSrc(null);
        }
        return true;
      }
      if (isPreviewPhotoOpen) {
        setIsPreviewPhotoOpen(false);
        return true;
      }
      if (isPhotoActionsOpen) {
        setIsPhotoActionsOpen(false);
        return true;
      }
      if (isDeleteDialogOpen) {
        setIsDeleteDialogOpen(false);
        return true;
      }
      handleClose();
      return true;
    }, 80);
  }, [
    isOpen,
    isCropPhotoOpen,
    cropImageSrc,
    isPreviewPhotoOpen,
    isPhotoActionsOpen,
    isDeleteDialogOpen,
    handleClose,
  ]);

  // Toggle ketersediaan menu (auto-save langsung)
  const handleToggleAvailability = () => {
    const nextVal = !available;
    setAvailable(nextVal);
    triggerHapticFeedback([25]);
    if (item) {
      toggleItemAvailability(item.id, nextVal);
    }
  };

  // Simpan perubahan menu
  const handleSave = async () => {
    if (!item) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      triggerShake('name');
      nameInputRef.current?.focus();
      return;
    }

    if (!price || price <= 0) {
      triggerShake('price');
      priceInputRef.current?.focus();
      return;
    }

    triggerHapticFeedback([20]);

    await updateMenuItem({
      id: item.id,
      name: trimmedName,
      price_idr: price,
      available,
      group_id: groupId,
      photo_path: photoPath,
    });

    onSaved?.({
      ...item,
      name: trimmedName,
      price_idr: price,
      available,
      group_id: groupId,
      photo_path: photoPath,
    });

    onClose();
  };

  // Keyboard shortcut Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  // Hapus menu (Konsisten dengan hapus kasir)
  const handleConfirmDelete = async () => {
    if (!item || !canConfirmDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      triggerHapticDelete();
      const id = item.id;
      await deleteMenuItem(id);
      setIsDeleteDialogOpen(false);
      onDeleted?.(id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  // Foto handlers
  const handleFoodFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    setIsCropPhotoOpen(true);
    e.target.value = '';
  };

  const handleFoodCropComplete = (croppedBlob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPhotoPath(dataUrl);
      setIsCropPhotoOpen(false);
      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc(null);
      }
    };
    reader.readAsDataURL(croppedBlob);
  };

  const handlePointerDownPhoto = () => {
    didTriggerPhotoHoldRef.current = false;
    if (!photoPath) return;
    photoHoldTimerRef.current = setTimeout(() => {
      didTriggerPhotoHoldRef.current = true;
      triggerHapticFeedback([25]);
      setIsPreviewPhotoOpen(true);
    }, 450);
  };

  const handlePointerUpPhoto = () => {
    if (photoHoldTimerRef.current) {
      clearTimeout(photoHoldTimerRef.current);
      photoHoldTimerRef.current = null;
    }
  };

  const handlePhotoBoxClick = () => {
    if (didTriggerPhotoHoldRef.current) {
      didTriggerPhotoHoldRef.current = false;
      return;
    }
    if (photoPath) {
      setIsPhotoActionsOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  if (!isOpen || !item) return null;

  const modalContent = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFoodFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Backdrop overlay (Floating Bottom Sheet persis seperti Add Menu) */}
      <div
        className="tk-phone-overlay ov"
        onClick={handleClose}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="g-liquid tk-phone-sheet sh"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b
              style={{
                fontSize: 'var(--t-lg)',
                lineHeight: 'var(--l-lg)',
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Ubah Detail Menu
            </b>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Tombol Hapus Menu */}
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
                aria-label="Hapus menu"
                title="Hapus menu"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--r-md)',
                  background: 'rgba(255, 59, 48, 0.12)',
                  border: '1px solid rgba(255, 59, 48, 0.25)',
                  color: '#ff453a',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  boxSizing: 'border-box',
                  transition: 'transform 0.12s ease, background 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>

              {/* Toggle Ketersediaan Menu (Auto-save langsung) */}
              <button
                type="button"
                onClick={handleToggleAvailability}
                aria-label={available ? 'Menu aktif' : 'Menu dinonaktifkan'}
                title={available ? 'Menu aktif' : 'Menu dinonaktifkan'}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: 'var(--r-pill)',
                  background: available ? 'var(--accent)' : 'var(--ctl-line)',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: 'var(--r-pill)',
                    background: '#ffffff',
                    transform: available ? 'translateX(20px)' : 'translateX(0px)',
                    transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
            {/* Baris Pertama: Foto dan Nama Menu */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--ink-3)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Nama Menu
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Box Foto Makanan */}
                <div
                  onClick={handlePhotoBoxClick}
                  onPointerDown={handlePointerDownPhoto}
                  onPointerUp={handlePointerUpPhoto}
                  onPointerLeave={handlePointerUpPhoto}
                  onPointerCancel={handlePointerUpPhoto}
                  role="button"
                  tabIndex={0}
                  aria-label="Foto makanan (Tahan untuk melihat pratinjau)"
                  title={photoPath ? "Klik untuk opsi foto, tahan untuk melihat pratinjau" : "Klik untuk memilih foto makanan"}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ctl)',
                    border: '1px solid var(--ctl-line)',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    touchAction: 'none',
                  }}
                >
                  {photoPath ? (
                    <img
                      src={photoPath}
                      alt="Foto makanan"
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
                        zIndex: 1,
                      }}
                    />
                  ) : (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--ink-3)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  )}

                  {/* Icon Sunting Liquid Glass */}
                  <div
                    className="g-liquid"
                    style={{
                      position: 'absolute',
                      bottom: '3px',
                      right: '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: 'var(--r-pill)',
                      border: '1px solid rgba(255, 255, 255, 0.40)',
                      background: 'color-mix(in srgb, var(--acrylic-bg) 75%, transparent)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      display: 'grid',
                      placeItems: 'center',
                      zIndex: 3,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                      color: 'var(--ink)',
                      pointerEvents: 'none',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                </div>

                {/* Input Nama Menu */}
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nama menu"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '52px',
                    padding: '0 14px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ctl)',
                    border: shakeField === 'name' ? '1.5px solid var(--danger)' : '1px solid var(--ctl-line)',
                    color: 'var(--ink)',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                    animation: shakeField === 'name' ? 'tk-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Baris Kedua: Harga Jual */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--ink-3)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Harga Jual
              </label>
              <div
                className="tk-price-field"
                style={{
                  border: shakeField === 'price' ? '1.5px solid var(--danger)' : undefined,
                  animation: shakeField === 'price' ? 'tk-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)' : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--t-sm)',
                    fontWeight: 800,
                    color: 'var(--ink-2)',
                    userSelect: 'none',
                    lineHeight: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    marginRight: '6px',
                    flexShrink: 0,
                  }}
                >
                  Rp
                </span>
                <input
                  ref={priceInputRef}
                  type="text"
                  inputMode="numeric"
                  className="tk-no-focus-outline"
                  value={priceStr}
                  placeholder="0"
                  onChange={(e) => {
                    const formatted = formatThousands(e.target.value);
                    setPriceStr(formatted);
                    setPrice(parseThousands(formatted));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '0') {
                      const input = e.currentTarget;
                      const isAtStart = input.selectionStart === 0;
                      const isAllSelected =
                        input.selectionStart === 0 && input.selectionEnd === input.value.length;
                      if (!input.value || isAtStart || isAllSelected) {
                        e.preventDefault();
                        return;
                      }
                    }
                    handleKeyDown(e);
                  }}
                  style={{
                    flex: 1,
                    height: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ink)',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 700,
                    outline: 'none',
                    padding: 0,
                    margin: 0,
                    lineHeight: 1,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Baris Ketiga: Kategori Menu */}
            <CategoryDropdown
              label="Kategori Menu"
              selectedGroupId={groupId}
              groups={groups}
              onSelectGroup={(id) => setGroupId(id)}
              direction="up"
            />

            {/* Tombol Batal & Simpan */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="tk-btn-flat"
                onClick={handleClose}
                style={{ flex: 1, height: '44px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="tk-btn-lime"
                onClick={handleSave}
                style={{ flex: 1, height: '44px' }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Menu (Konsisten 100% dengan Dialog Hapus Kasir) */}
      {isDeleteDialogOpen && (
        <div
          className="tk-phone-overlay ov"
          onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi Hapus Menu"
          style={{ zIndex: 160 }}
        >
          <div
            className="g-liquid tk-phone-dialog"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{ gap: '14px', zIndex: 165 }}
          >
            <b
              style={{
                fontSize: 'var(--t-lg)',
                lineHeight: 'var(--l-lg)',
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Hapus menu?
            </b>

            <span
              style={{
                fontSize: 'var(--t-sm)',
                lineHeight: 'var(--l-sm)',
                color: 'var(--ink-2)',
              }}
            >
              Hapus menu <b>{name || item.name}</b> dari daftar menu kafe? Tindakan ini tidak dapat dibatalkan.
            </span>

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                type="button"
                className="tk-btn-flat"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                style={{ flex: 1, height: '48px', fontSize: 'var(--t-sm)' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={canConfirmDelete && !isDeleting ? handleConfirmDelete : undefined}
                disabled={!canConfirmDelete || isDeleting}
                style={{
                  flex: 1,
                  height: '48px',
                  fontSize: 'var(--t-sm)',
                  fontWeight: 800,
                  background: 'var(--danger)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--r-md)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.25)',
                  cursor: canConfirmDelete && !isDeleting ? 'pointer' : 'not-allowed',
                  opacity: canConfirmDelete && !isDeleting ? 1 : 0.6,
                  pointerEvents: canConfirmDelete && !isDeleting ? 'auto' : 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  transition: 'opacity 0.15s ease, transform 0.1s ease',
                }}
              >
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Opsi Foto Makanan (Eyes, Sunting, Trash, Batal) */}
      <PhotoActionsDialog
        isOpen={isPhotoActionsOpen}
        hasPhoto={Boolean(photoPath)}
        onClose={() => setIsPhotoActionsOpen(false)}
        onViewPhoto={() => {
          setIsPhotoActionsOpen(false);
          setIsPreviewPhotoOpen(true);
        }}
        onChangePhoto={() => {
          setIsPhotoActionsOpen(false);
          fileInputRef.current?.click();
        }}
        onDeletePhoto={() => {
          setIsPhotoActionsOpen(false);
          setPhotoPath(null);
        }}
      />

      {/* Pratinjau Foto Makanan Fullscreen saat di-Hold */}
      {isPreviewPhotoOpen && photoPath && (
        <div
          className="tk-menu-detail-overlay"
          onClick={() => setIsPreviewPhotoOpen(false)}
          role="dialog"
          aria-modal="true"
          style={{
            zIndex: 170,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 'min(360px, 90vw)',
              aspectRatio: '1/1',
              borderRadius: 'var(--r-xl)',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <img
              src={photoPath}
              alt="Pratinjau Foto Makanan"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      )}

      {/* Dialog Crop Foto Makanan (1:1 Resolusi Bersih) */}
      <CropProfileDialog
        isOpen={isCropPhotoOpen}
        imageSrc={cropImageSrc}
        onClose={() => {
          setIsCropPhotoOpen(false);
          if (cropImageSrc) {
            URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null);
          }
        }}
        onCropComplete={handleFoodCropComplete}
      />
    </>
  );

  const portalTarget = typeof document !== 'undefined'
    ? document.getElementById('tk-portal-root') || document.body
    : null;

  return portalTarget ? createPortal(modalContent, portalTarget) : null;
};
