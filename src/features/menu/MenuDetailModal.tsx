import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MenuItem } from '../../lib/supabase/types.ts';
import { useMenuStore } from '../../stores/menuStore.ts';
import { CategoryDropdown } from './CategoryDropdown.tsx';
import { triggerHapticFeedback } from '../../lib/device/haptics.ts';
import { registerBackHandler } from '../../lib/device/backButton.ts';

function formatThousands(value: number | string): string {
  const digits = String(value).replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
}) => {
  const { groups, toggleItemAvailability } = useMenuStore();

  const [available, setAvailable] = useState(true);

  // Inisialisasi status ketersediaan ketika modal dibuka
  useEffect(() => {
    if (isOpen && item) {
      setAvailable(item.available ?? true);
    }
  }, [isOpen, item]);

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
      handleClose();
      return true;
    }, 80);
  }, [isOpen, handleClose]);

  // Toggle ketersediaan menu (auto-save langsung)
  const handleToggleAvailability = () => {
    const nextVal = !available;
    setAvailable(nextVal);
    triggerHapticFeedback([25]);
    if (item) {
      toggleItemAvailability(item.id, nextVal);
    }
  };

  if (!isOpen || !item) return null;

  const photoPath = item.photo_path || null;
  const name = item.name || '';
  const priceStr = formatThousands(item.price_idr || 0);
  let groupId = item.group_id || '';
  if (groupId.startsWith('g-makanan')) groupId = 'g-makanan';

  const modalContent = (
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
          <div>
            <b
              style={{
                fontSize: 'var(--t-lg)',
                lineHeight: 'var(--l-lg)',
                fontWeight: 800,
                color: 'var(--ink)',
                display: 'block',
              }}
            >
              Detail Menu
            </b>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--ink-3)',
                display: 'block',
                marginTop: '2px',
              }}
            >
              Informasi menu &amp; ketersediaan kasir
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Tombol Hapus Menu (Abu-abu / Dinonaktifkan untuk Kasir) */}
            <button
              type="button"
              disabled={true}
              aria-label="Hapus menu dinonaktifkan"
              title="Hanya Owner yang dapat menghapus menu"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--r-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--ink-3)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'not-allowed',
                opacity: 0.35,
                padding: 0,
                boxSizing: 'border-box',
                pointerEvents: 'none',
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
              {/* Box Foto Makanan (Abu-abu / Read-only) */}
              <div
                role="img"
                aria-label="Foto makanan"
                title="Foto makanan (Hanya dapat diubah oleh Owner)"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--r-md)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ctl-line)',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  cursor: 'not-allowed',
                  opacity: 0.55,
                  boxSizing: 'border-box',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  pointerEvents: 'none',
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
              </div>

              {/* Input Nama Menu (Abu-abu / Read-only) */}
              <input
                type="text"
                value={name}
                readOnly={true}
                disabled={true}
                placeholder="Nama menu"
                title="Hanya Owner yang dapat mengubah nama menu"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '52px',
                  padding: '0 14px',
                  borderRadius: 'var(--r-md)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--ctl-line)',
                  color: 'var(--ink-2)',
                  fontSize: 'var(--t-sm)',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed',
                  opacity: 0.6,
                }}
              />
            </div>
          </div>

          {/* Baris Kedua: Harga Jual (Abu-abu / Read-only) */}
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
              title="Hanya Owner yang dapat mengubah harga jual"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--ctl-line)',
                cursor: 'not-allowed',
                opacity: 0.6,
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
                readOnly={true}
                disabled={true}
                className="tk-no-focus-outline"
                value={priceStr}
                placeholder="0"
                style={{
                  flex: 1,
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink-2)',
                  fontSize: 'var(--t-sm)',
                  fontWeight: 700,
                  outline: 'none',
                  padding: 0,
                  margin: 0,
                  lineHeight: 1,
                  boxSizing: 'border-box',
                  cursor: 'not-allowed',
                }}
              />
            </div>
          </div>

          {/* Baris Ketiga: Kategori Menu (Abu-abu / Disabled) */}
          <div title="Hanya Owner yang dapat mengubah kategori menu">
            <CategoryDropdown
              label="Kategori Menu"
              selectedGroupId={groupId}
              groups={groups}
              onSelectGroup={() => {}}
              direction="up"
              disabled={true}
            />
          </div>

          {/* Tombol Tutup */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="tk-btn-flat"
              onClick={handleClose}
              style={{ flex: 1, height: '44px' }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
