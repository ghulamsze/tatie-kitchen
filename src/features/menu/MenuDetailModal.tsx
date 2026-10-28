import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MenuItem, MenuVariant } from '../../lib/supabase/types.ts';
import { useMenuStore, getItemCategory, CanonicalMenuCategory } from '../../stores/menuStore.ts';
import { triggerHapticFeedback, triggerHapticDelete } from '../../lib/device/haptics.ts';
import { registerBackHandler } from '../../lib/device/backButton.ts';

function formatThousands(value: number | string): string {
  const digits = String(value).replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseThousands(value: string): number {
  const digits = String(value).replace(/\D/g, '').replace(/^0+/, '');
  return digits ? parseInt(digits, 10) : 0;
}

const CATEGORY_OPTIONS: { key: CanonicalMenuCategory; label: string }[] = [
  { key: 'camilan', label: 'Camilan' },
  { key: 'makanan', label: 'Makanan' },
  { key: 'minuman', label: 'Minuman' },
  { key: 'roti_kue', label: 'Roti & Kue' },
  { key: 'tunagizi', label: 'Tunagizi' },
];

export interface MenuDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: (itemId: string) => void;
  onSaved?: (item: MenuItem) => void;
  isCashierTablet?: boolean;
}

export const MenuDetailModal: React.FC<MenuDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onDeleted,
  onSaved,
  isCashierTablet = false,
}) => {
  const { groups, toggleItemAvailability, updateMenuItem, deleteMenuItem, togglePinItem, isItemPinned } = useMenuStore();

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [priceStr, setPriceStr] = useState('');
  const [available, setAvailable] = useState(true);
  const [category, setCategory] = useState<CanonicalMenuCategory>('makanan');
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [variants, setVariants] = useState<MenuVariant[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Inisialisasi status ketika modal dibuka
  useEffect(() => {
    if (isOpen && item) {
      setName(item.name || '');
      setPrice(item.price_idr || 0);
      setPriceStr(formatThousands(item.price_idr || 0));
      setAvailable(item.available ?? true);
      setPhotoPath(item.photo_path || null);
      setCategory(getItemCategory(item, groups));
      setVariants(item.variants ? JSON.parse(JSON.stringify(item.variants)) : []);
      setIsAdvancedOpen(false);
      setIsCategoryDropdownOpen(false);
      setIsConfirmDeleteOpen(false);
    }
  }, [isOpen, item, groups]);

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

  // Click outside listener untuk dropdown kategori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener('pointerdown', handleClickOutside as any);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside as any);
    };
  }, [isCategoryDropdownOpen]);

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
      if (isConfirmDeleteOpen) {
        setIsConfirmDeleteOpen(false);
        return true;
      }
      if (isCategoryDropdownOpen) {
        setIsCategoryDropdownOpen(false);
        return true;
      }
      handleClose();
      return true;
    }, 80);
  }, [isOpen, isConfirmDeleteOpen, isCategoryDropdownOpen, handleClose]);

  // Toggle ketersediaan menu (auto-save langsung)
  const handleToggleAvailability = () => {
    const nextVal = !available;
    setAvailable(nextVal);
    triggerHapticFeedback([25]);
    if (item) {
      toggleItemAvailability(item.id, nextVal);
    }
  };

  // Simpan perubahan form (khusus HP/iOS)
  const handleSavePhone = async () => {
    if (!item || isCashierTablet) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    triggerHapticFeedback([20]);

    const safeGroup = groups.find((g) => {
      const gc = (g.category || '').toLowerCase();
      if (category === 'roti_kue' || category === 'tunagizi' || category === 'camilan') {
        return gc === 'snack';
      }
      return gc === category;
    });

    const updatedData: any = {
      name: trimmedName,
      price_idr: price,
      available,
      photo_path: photoPath,
      variants,
      group_id: safeGroup ? safeGroup.id : item.group_id,
      category,
    };

    await updateMenuItem({
      id: item.id,
      ...updatedData,
    });

    onSaved?.({
      ...item,
      ...updatedData,
    } as MenuItem);

    onClose();
  };

  // Hapus menu (khusus HP/iOS)
  const handleConfirmDelete = async () => {
    if (!item || isCashierTablet) return;
    triggerHapticDelete();
    await deleteMenuItem(item.id);
    setIsConfirmDeleteOpen(false);
    onDeleted?.(item.id);
    onClose();
  };

  // Upload foto makanan (khusus HP/iOS)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPhotoPath(reader.result);
        triggerHapticFeedback([20]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Tambah varian baru (khusus HP/iOS)
  const handleAddVariant = () => {
    if (isCashierTablet) return;
    const newVariants = [...variants, { name: '', price_idr: price || item?.price_idr || 0 }];
    setVariants(newVariants);
    triggerHapticFeedback([20]);
  };

  // Ubah varian (khusus HP/iOS)
  const handleUpdateVariant = (index: number, field: 'name' | 'price_idr', val: any) => {
    if (isCashierTablet) return;
    const updated = variants.map((v, i) => (i === index ? { ...v, [field]: val } : v));
    setVariants(updated);
  };

  // Hapus varian (khusus HP/iOS)
  const handleDeleteVariant = (index: number) => {
    if (isCashierTablet) return;
    triggerHapticDelete();
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
  };

  if (!isOpen || !item) return null;

  const isPinned = item ? isItemPinned(item.id, item.name) : false;

  const currentCategoryLabel =
    CATEGORY_OPTIONS.find((c) => c.key === category)?.label || 'Makanan';

  const modalContent = (
    <div
      className="tk-phone-overlay ov"
      onClick={handleClose}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '0 0 calc(16px + env(safe-area-inset-bottom, 0px)) 0',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <div
        className="g-liquid tk-phone-sheet sh"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, calc(100% - 24px))',
          maxWidth: '440px',
          maxHeight: 'min(90dvh, 620px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          padding: '20px',
          borderRadius: 'var(--r-xl, 24px)',
          margin: '0 auto',
        }}
      >
        {/* Header (Tanpa sub-deskripsi) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b
            style={{
              fontSize: 'var(--t-lg)',
              lineHeight: 'var(--l-lg)',
              fontWeight: 800,
              color: 'var(--ink)',
            }}
          >
            Detail Menu
          </b>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Tombol Sematkan Menu (Pin) */}
            <button
              type="button"
              onClick={() => {
                if (item) {
                  triggerHapticFeedback([25]);
                  togglePinItem(item.id);
                }
              }}
              aria-label={isPinned ? 'Lepas sematan menu' : 'Sematkan menu ke atas'}
              title={isPinned ? 'Lepas sematan menu dari paling atas' : 'Sematkan menu ke paling atas'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--r-md)',
                background: isPinned ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : 'rgba(255, 255, 255, 0.05)',
                border: isPinned ? '1px solid var(--accent)' : '1px solid var(--ctl-line)',
                color: isPinned ? 'var(--accent)' : 'var(--ink-3)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                padding: 0,
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17v5" />
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 1 1-1 1 1 0 0 0 1-1V2H7v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z" />
              </svg>
            </button>

            {/* Tombol Hapus Menu */}
            <button
              type="button"
              disabled={isCashierTablet}
              onClick={() => {
                if (!isCashierTablet) {
                  triggerHapticFeedback([25]);
                  setIsConfirmDeleteOpen(true);
                }
              }}
              aria-label={isCashierTablet ? 'Hapus menu dinonaktifkan' : 'Hapus menu'}
              title={isCashierTablet ? 'Hanya dapat dihapus melalui HP / Akun Owner' : 'Hapus menu ini'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--r-md)',
                background: isCashierTablet ? 'rgba(255, 255, 255, 0.04)' : 'rgba(239, 68, 68, 0.12)',
                border: isCashierTablet ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(239, 68, 68, 0.25)',
                color: isCashierTablet ? 'var(--ink-3)' : '#ef4444',
                display: 'grid',
                placeItems: 'center',
                cursor: isCashierTablet ? 'not-allowed' : 'pointer',
                opacity: isCashierTablet ? 0.35 : 1,
                padding: 0,
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
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

            {/* Toggle Ketersediaan Menu */}
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
              {/* Box Foto Makanan dengan Badge Sunting Liquid Glass */}
              <div
                style={{
                  position: 'relative',
                  width: '52px',
                  height: '52px',
                  flexShrink: 0,
                }}
              >
                <div
                  onClick={() => {
                    if (!isCashierTablet) {
                      fileInputRef.current?.click();
                    }
                  }}
                  role={isCashierTablet ? 'img' : 'button'}
                  aria-label="Foto makanan"
                  title={isCashierTablet ? 'Foto makanan' : 'Klik untuk mengubah foto'}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: isCashierTablet ? '1px solid var(--ctl-line)' : '1px dashed var(--accent)',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: isCashierTablet ? 'default' : 'pointer',
                    opacity: isCashierTablet ? 0.6 : 1,
                    boxSizing: 'border-box',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
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
                      }}
                    />
                  ) : (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isCashierTablet ? 'var(--ink-3)' : 'var(--accent)'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  )}
                </div>

                {/* Icon Sunting Liquid Glass di Ujung Bawah Kanan sedikit keluar dari frame (Sesuai Profile Pict) */}
                {!isCashierTablet && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    aria-label="Sunting foto makanan"
                    title="Sunting foto makanan"
                    className="g-liquid"
                    style={{
                      position: 'absolute',
                      bottom: '-3px',
                      right: '-3px',
                      width: '22px',
                      height: '22px',
                      borderRadius: 'var(--r-pill)',
                      border: '1px solid rgba(255, 255, 255, 0.40)',
                      background: 'color-mix(in srgb, var(--acrylic-bg) 85%, transparent)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      display: 'grid',
                      placeItems: 'center',
                      zIndex: 5,
                      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.45)',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'transform 0.15s ease, background 0.15s ease',
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Input Nama Menu */}
              <input
                type="text"
                value={name}
                onChange={(e) => !isCashierTablet && setName(e.target.value)}
                readOnly={isCashierTablet}
                disabled={isCashierTablet}
                placeholder="Nama menu"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '52px',
                  padding: '0 14px',
                  borderRadius: 'var(--r-md)',
                  background: isCashierTablet ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                  border: isCashierTablet ? '1px solid var(--ctl-line)' : '1.5px solid var(--ctl-line)',
                  color: 'var(--ink)',
                  fontSize: 'var(--t-sm)',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: isCashierTablet ? 'not-allowed' : 'text',
                  opacity: isCashierTablet ? 0.6 : 1,
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
                background: isCashierTablet ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--ctl-line)',
                cursor: isCashierTablet ? 'not-allowed' : 'text',
                opacity: isCashierTablet ? 0.6 : 1,
              }}
            >
              <span
                style={{
                  fontSize: 'var(--t-sm)',
                  fontWeight: 800,
                  color: 'var(--ink-3)',
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
                type="text"
                readOnly={isCashierTablet}
                disabled={isCashierTablet}
                className="tk-no-focus-outline"
                value={priceStr}
                onChange={(e) => {
                  if (!isCashierTablet) {
                    const parsed = parseThousands(e.target.value);
                    setPrice(parsed);
                    setPriceStr(formatThousands(parsed));
                  }
                }}
                placeholder="0"
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
                  cursor: isCashierTablet ? 'not-allowed' : 'text',
                }}
              />
            </div>
          </div>

          {/* Baris Ketiga: Kategori Menu (Hanya 5 Kategori Pokok: Makanan, Minuman, Roti & Kue, Tunagizi, Camilan) */}
          <div ref={categoryRef} style={{ position: 'relative' }}>
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
              Kategori Menu
            </label>
            <button
              type="button"
              disabled={isCashierTablet}
              onClick={() => !isCashierTablet && setIsCategoryDropdownOpen((prev) => !prev)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px',
                borderRadius: 'var(--r-md)',
                background: isCashierTablet ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--ctl-line)',
                color: 'var(--ink)',
                fontSize: 'var(--t-sm)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: isCashierTablet ? 'not-allowed' : 'pointer',
                opacity: isCashierTablet ? 0.6 : 1,
                boxSizing: 'border-box',
              }}
            >
              <span>{currentCategoryLabel}</span>
              {!isCashierTablet && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </button>

            {/* Menu Popover Pilihan 5 Kategori */}
            {isCategoryDropdownOpen && !isCashierTablet && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: 'color-mix(in srgb, var(--acrylic, #181414) 95%, #000)',
                  border: '1px solid var(--ctl-line)',
                  borderRadius: 'var(--r-md)',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.5)',
                  zIndex: 200,
                  overflow: 'hidden',
                  padding: '4px',
                }}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setCategory(opt.key);
                      setIsCategoryDropdownOpen(false);
                      triggerHapticFeedback([15]);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--r-sm)',
                      background: category === opt.key ? 'var(--accent)' : 'transparent',
                      color: category === opt.key ? 'var(--on-accent, #000)' : 'var(--ink)',
                      border: 'none',
                      fontSize: 'var(--t-sm)',
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.1s ease',
                    }}
                  >
                    <span>{opt.label}</span>
                    {category === opt.key && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Baris Keempat: Varian (Hanya Tombol Panah Bawah Murni Tanpa Teks, Tidak Terbuka di Tablet) */}
          <div
            style={{
              borderRadius: 'var(--r-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--ctl-line)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Header Accordion Varian: Murni Ikon Panah Bawah Saja */}
            <button
              type="button"
              disabled={isCashierTablet}
              onClick={() => {
                if (!isCashierTablet) {
                  setIsAdvancedOpen(!isAdvancedOpen);
                  triggerHapticFeedback([15]);
                }
              }}
              aria-label="Buka varian"
              title={isCashierTablet ? '' : 'Buka pilihan varian'}
              style={{
                width: '100%',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: isCashierTablet ? 'not-allowed' : 'pointer',
                opacity: isCashierTablet ? 0.35 : 0.85,
                padding: 0,
                color: 'var(--ink)',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isAdvancedOpen && !isCashierTablet ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Konten Editor Varian (Hanya Terbuka saat Ditekan di HP/iOS, TIDAK Terbuka di Tablet) */}
            {isAdvancedOpen && !isCashierTablet && (
              <div
                style={{
                  padding: '10px 14px 14px 14px',
                  borderTop: '1px solid var(--ctl-line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {variants.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '8px',
                      color: 'var(--ink-3)',
                      fontSize: '12px',
                    }}
                  >
                    Belum ada varian menu.
                  </div>
                ) : (
                  variants.map((variant, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {/* Input Nama Varian */}
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleUpdateVariant(index, 'name', e.target.value)}
                        placeholder="Nama varian"
                        style={{
                          flex: 1.2,
                          height: '40px',
                          padding: '0 10px',
                          borderRadius: 'var(--r-md)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--ctl-line)',
                          color: 'var(--ink)',
                          fontSize: 'var(--t-xs)',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />

                      {/* Input Harga Varian */}
                      <div
                        style={{
                          flex: 1,
                          height: '40px',
                          padding: '0 8px',
                          borderRadius: 'var(--r-md)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--ctl-line)',
                          display: 'flex',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-3)', marginRight: '4px' }}>
                          Rp
                        </span>
                        <input
                          type="text"
                          value={formatThousands(variant.price_idr)}
                          onChange={(e) => handleUpdateVariant(index, 'price_idr', parseThousands(e.target.value))}
                          placeholder="0"
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--ink)',
                            fontSize: 'var(--t-xs)',
                            fontWeight: 700,
                            outline: 'none',
                            padding: 0,
                            margin: 0,
                          }}
                        />
                      </div>

                      {/* Tombol Hapus Varian */}
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(index)}
                        aria-label="Hapus varian"
                        style={{
                          width: '36px',
                          height: '40px',
                          borderRadius: 'var(--r-md)',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--ctl-line)',
                          color: 'var(--ink-3)',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          padding: 0,
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}

                {/* Tombol Tambah Varian Baru (+) */}
                <button
                  type="button"
                  onClick={handleAddVariant}
                  style={{
                    height: '38px',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px dashed var(--ctl-line)',
                    color: 'var(--accent)',
                    fontSize: 'var(--t-xs)',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    marginTop: '2px',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tambah Varian
                </button>
              </div>
            )}
          </div>

          {/* Tombol Aksi Bawah */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="tk-btn-flat"
              onClick={handleClose}
              style={{ flex: 1, height: '44px' }}
            >
              {isCashierTablet ? 'Tutup' : 'Batal'}
            </button>
            {!isCashierTablet && (
              <button
                type="button"
                className="tk-btn-lime"
                onClick={handleSavePhone}
                style={{ flex: 1, height: '44px' }}
              >
                Simpan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Konfirmasi Hapus Menu (Khusus HP/iOS) */}
      {isConfirmDeleteOpen && !isCashierTablet && (
        <div
          className="tk-phone-overlay ov"
          onClick={() => setIsConfirmDeleteOpen(false)}
          style={{ zIndex: 1100, display: 'grid', placeItems: 'center', padding: '16px' }}
        >
          <div
            className="g-liquid"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '320px',
              padding: '20px',
              borderRadius: 'var(--r-lg)',
              border: '1px solid var(--ctl-line)',
              textAlign: 'center',
            }}
          >
            <b style={{ fontSize: 'var(--t-md)', color: 'var(--ink)', display: 'block', marginBottom: '8px' }}>
              Hapus Menu?
            </b>
            <p style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)', margin: '0 0 16px' }}>
              Menu <b>{name}</b> akan dihapus dari daftar menu.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="tk-btn-flat"
                onClick={() => setIsConfirmDeleteOpen(false)}
                style={{ flex: 1, height: '40px' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  height: '40px',
                  borderRadius: 'var(--r-md)',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 'var(--t-xs)',
                  cursor: 'pointer',
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};
