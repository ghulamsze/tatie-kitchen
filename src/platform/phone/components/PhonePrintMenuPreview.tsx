import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PrintMenuDocument } from './PrintMenuDocument.tsx';

export interface PhonePrintMenuPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  initialMargin4433?: boolean;
  initialInkSaver?: boolean;
}

export const PhonePrintMenuPreview: React.FC<PhonePrintMenuPreviewProps> = ({
  isOpen,
  onClose,
  initialMargin4433 = false,
  initialInkSaver = false,
}) => {
  const [isMargin4433, setIsMargin4433] = useState(initialMargin4433);
  const [isInkSaver, setIsInkSaver] = useState(initialInkSaver);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      // Pastikan portal termount sempurna sebelum window.print dipanggil
      setTimeout(() => {
        try {
          window.print();
        } catch {
          // ignore
        }
      }, 60);
    }
  };

  const portalContent = typeof document !== 'undefined'
    ? createPortal(
        <div id="mps-print-portal" aria-hidden="true">
          <PrintMenuDocument
            isMargin4433={isMargin4433}
            isInkSaver={isInkSaver}
            isVisibleInPreview={true}
          />
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {portalContent}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 120,
          background: 'var(--scr-bg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'tk-fade-in 0.2s ease-out',
        }}
      >
        {/* Top Bar Kontrol Pratinjau Cetak */}
        <div
          className="g-acrylic"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid var(--ctl-line)',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink)',
              fontSize: 'var(--t-sm)',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ‹ Kembali
          </button>

          <b style={{ fontSize: 'var(--t-sm)', color: 'var(--ink)', fontWeight: 800 }}>
            Pratinjau Cetak Menu A4
          </b>

          <button
            type="button"
            className="tk-btn-lime"
            onClick={handlePrint}
            style={{
              height: '36px',
              padding: '0 16px',
              fontSize: '12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: 'var(--r-pill)',
            }}
          >
            <span>🖨️</span>
            <span>Cetak A4</span>
          </button>
        </div>

        {/* Sub-bar Pilihan Margin & Mode Tinta */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '10px 16px',
            background: 'rgb(var(--w) / 0.04)',
            borderBottom: '1px solid rgb(var(--w) / 0.08)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`tk-chip ${!isMargin4433 ? 'active lime' : ''}`}
              onClick={() => setIsMargin4433(false)}
              style={{ fontSize: '11px', padding: '6px 12px', height: '30px' }}
            >
              Margin Normal
            </button>
            <button
              type="button"
              className={`tk-chip ${isMargin4433 ? 'active lime' : ''}`}
              onClick={() => setIsMargin4433(true)}
              style={{ fontSize: '11px', padding: '6px 12px', height: '30px' }}
            >
              Margin 4433 (Jilid)
            </button>
            <button
              type="button"
              className={`tk-chip ${isInkSaver ? 'active lime' : ''}`}
              onClick={() => setIsInkSaver(!isInkSaver)}
              style={{ fontSize: '11px', padding: '6px 12px', height: '30px' }}
            >
              {isInkSaver ? '✓ Hemat Tinta (Putih)' : 'Warna Latar Gelap'}
            </button>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>
            4 Halaman Fisik A4
          </span>
        </div>

        {/* Petunjuk Penggunaan Cetak Ringkas */}
        <div
          style={{
            padding: '8px 16px',
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            borderBottom: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
            fontSize: '11px',
            color: 'var(--ink-2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 800 }}>ℹ️</span>
          <span>
            Di jendela dialog cetak printer: pilih kertas <b>A4</b>, margin <b>Minimum/Nol</b>, dan centang opsi <b>Grafik latar belakang</b>.
          </span>
        </div>

        {/* Area Pratinjau Dokumen Fisik A4 yang Bisa Di-scroll */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px 8px 60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ transformOrigin: 'top center', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <PrintMenuDocument
              isMargin4433={isMargin4433}
              isInkSaver={isInkSaver}
              isVisibleInPreview={true}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PhonePrintMenuPreview;
