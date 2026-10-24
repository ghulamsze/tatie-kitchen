import React, { useState } from 'react';

export interface PhonePrintMenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (options: { isMargin4433: boolean; isInkSaver: boolean }) => void;
}

export const PhonePrintMenuDialog: React.FC<PhonePrintMenuDialogProps> = ({
  isOpen,
  onClose,
  onPrint,
}) => {
  const [isMargin4433, setIsMargin4433] = useState(false);
  const [isInkSaver, setIsInkSaver] = useState(false);

  if (!isOpen) return null;

  const handlePrintClick = () => {
    onPrint({ isMargin4433, isInkSaver });
    onClose();
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      setTimeout(() => {
        try {
          window.print();
        } catch {
          // Abaikan jika lingkungan test tidak mengimplementasikan print
        }
      }, 50);
    }
  };

  return (
    <div
      className="tk-phone-overlay ov"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Dialog Cetak Menu A4"
    >
      <div
        className="g-liquid tk-phone-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ gap: '14px' }}
      >
        <b
          style={{
            fontSize: 'var(--t-lg)',
            lineHeight: 'var(--l-lg)',
            fontWeight: 800,
            color: 'var(--ink)',
          }}
        >
          Cetak menu
        </b>

        <span
          style={{
            fontSize: 'var(--t-xs)',
            lineHeight: 'var(--l-xs)',
            color: 'var(--ink-2)',
            marginTop: '-4px',
          }}
        >
          Menu fisik A4: satu sampul dan tiga halaman isi. Di jendela cetak, pilih ukuran A4 dan
          nyalakan opsi grafik latar.
        </span>

        {/* 1. Pilihan Margin Normal */}
        <button
          type="button"
          className={`tk-phone-op op ${!isMargin4433 ? 'selected a' : ''}`}
          onClick={() => setIsMargin4433(false)}
          aria-pressed={!isMargin4433}
        >
          <span>Margin normal (2,54 cm)</span>
          <span className="tk-phone-op-check">{!isMargin4433 ? '✓' : ''}</span>
        </button>

        {/* 2. Pilihan Margin 4433 */}
        <button
          type="button"
          className={`tk-phone-op op ${isMargin4433 ? 'selected a' : ''}`}
          onClick={() => setIsMargin4433(true)}
          aria-pressed={isMargin4433}
        >
          <span>Margin 4433 (kiri 4, atas 4, kanan 3, bawah 3 cm)</span>
          <span className="tk-phone-op-check">{isMargin4433 ? '✓' : ''}</span>
        </button>

        {/* 3. Pilihan Hemat Tinta */}
        <button
          type="button"
          className={`tk-phone-op op ${isInkSaver ? 'selected a' : ''}`}
          onClick={() => setIsInkSaver(!isInkSaver)}
          aria-pressed={isInkSaver}
        >
          <span>Hemat tinta (latar terang)</span>
          <span className="tk-phone-op-check">{isInkSaver ? '✓' : ''}</span>
        </button>

        {/* Tombol Aksi: Batal (Flat) & Cetak (Lime) */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            className="tk-btn-flat"
            onClick={onClose}
            style={{ flex: 1, height: '48px', fontSize: 'var(--t-sm)' }}
          >
            Batal
          </button>

          {/* SATU TOMBOL LIME PER DIALOG (Aturan Prioritas Highlight) */}
          <button
            type="button"
            className="tk-btn-lime"
            onClick={handlePrintClick}
            style={{ flex: 1, height: '48px', fontSize: 'var(--t-sm)' }}
          >
            Cetak
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhonePrintMenuDialog;
