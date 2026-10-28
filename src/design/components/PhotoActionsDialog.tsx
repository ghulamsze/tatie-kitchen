import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { registerBackHandler } from '../../lib/device/backButton.ts';
import { triggerHapticDelete } from '../../lib/device/haptics.ts';

export interface PhotoActionsDialogProps {
  isOpen: boolean;
  hasPhoto: boolean;
  onClose: () => void;
  onViewPhoto?: () => void;
  onChangePhoto: () => void;
  onDeletePhoto?: () => void;
  title?: string;
}

export const PhotoActionsDialog: React.FC<PhotoActionsDialogProps> = ({
  isOpen,
  hasPhoto,
  onClose,
  onViewPhoto,
  onChangePhoto,
  onDeletePhoto,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    return registerBackHandler(() => {
      onClose();
      return true;
    }, 90);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const portalTarget = typeof document !== 'undefined'
    ? (document.getElementById('tk-portal-root') || document.body)
    : null;

  if (!portalTarget) return null;

  return createPortal(
    <div
      className="tk-phone-overlay ov"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 160, display: 'grid', placeItems: 'center' }}
    >
      <div
        className="g-liquid tk-dialog-zoom-out"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '24px 20px 16px',
          borderRadius: 'var(--r-xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          width: '84%',
          maxWidth: '280px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.40)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15)',
          background: 'color-mix(in srgb, var(--acrylic-bg) 85%, transparent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Tombol-tombol Aksi Murni Ikon (Tanpa Teks Sesuai Instruksi) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            width: '100%',
            padding: '4px 0',
          }}
        >
          {hasPhoto ? (
            <>
              {/* 1. Ikon Eyes: Lihat Foto */}
              {onViewPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewPhoto();
                  }}
                  aria-label="Lihat Foto"
                  title="Lihat Foto"
                  className="g-liquid"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--ctl)',
                    border: '1px solid var(--ctl-line)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--ink)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    transition: 'transform 0.12s ease',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              )}

              {/* 2. Ikon Sunting: Ganti Foto */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onChangePhoto();
                }}
                aria-label="Ganti Foto"
                title="Ganti Foto"
                className="g-liquid"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--ctl)',
                  border: '1px solid var(--ctl-line)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--ink)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  transition: 'transform 0.12s ease',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              {/* 3. Ikon Trash: Hapus Foto */}
              {onDeletePhoto && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticDelete();
                    onClose();
                    onDeletePhoto();
                  }}
                  aria-label="Hapus Foto"
                  title="Hapus Foto"
                  className="g-liquid"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--r-pill)',
                    background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--danger)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    transition: 'transform 0.12s ease',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
            </>
          ) : (
            /* Jika tidak ada foto: ikon trash & sunting ganti tidak muncul, hanya ikon tambah/pilih foto */
            <button
              type="button"
              onClick={() => {
                onChangePhoto();
                onClose();
              }}
              aria-label="Pilih Foto"
              title="Pilih Foto"
              className="g-liquid"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--accent)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                color: 'var(--on-accent)',
                boxShadow: '0 6px 20px color-mix(in srgb, var(--accent) 40%, transparent)',
                transition: 'transform 0.12s ease',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                <line x1="16" y1="5" x2="22" y2="5" />
                <line x1="19" y1="2" x2="19" y2="8" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </button>
          )}
        </div>

        {/* Tombol Batal Sesuai Instruksi */}
        <button
          type="button"
          className="tk-btn-flat"
          onClick={onClose}
          style={{
            height: '40px',
            width: '100%',
            justifyContent: 'center',
            fontSize: 'var(--t-xs)',
            fontWeight: 700,
            borderRadius: 'var(--r-pill)',
          }}
        >
          Batal
        </button>
      </div>
    </div>,
    portalTarget
  );
};
