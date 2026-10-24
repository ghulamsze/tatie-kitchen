import React, { useState, useEffect } from 'react';
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

  // Pastikan navbar disembunyikan saat modal cetak menu terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-modal');
    }
    return () => {
      document.body.classList.remove('has-modal');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
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
        className="tk-phone-print-preview tk-phone-overlay ov"
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Cetak A4</span>
          </button>
        </div>

        {/* Sub-bar Pilihan Kontrol yang Jelas Berbeda Fungsi */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '10px 16px',
            background: 'rgb(var(--w) / 0.04)',
            borderBottom: '1px solid rgb(var(--w) / 0.08)',
          }}
        >
          {/* Kelompok 1: Opsi Tata Letak Margin Kertas (Segmented Pill Aksen) */}
          <div
            style={{
              display: 'inline-flex',
              padding: '3px',
              background: 'var(--ctl)',
              borderRadius: 'var(--r-pill)',
              border: '1px solid var(--ctl-line)',
              gap: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setIsMargin4433(false)}
              style={{
                border: 'none',
                background: !isMargin4433 ? 'var(--accent)' : 'transparent',
                color: !isMargin4433 ? 'var(--on-accent)' : 'var(--ink-2)',
                padding: '4px 12px',
                borderRadius: 'var(--r-pill)',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Margin Normal
            </button>
            <button
              type="button"
              onClick={() => setIsMargin4433(true)}
              style={{
                border: 'none',
                background: isMargin4433 ? 'var(--accent)' : 'transparent',
                color: isMargin4433 ? 'var(--on-accent)' : 'var(--ink-2)',
                padding: '4px 12px',
                borderRadius: 'var(--r-pill)',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Margin 4433 (Jilid)
            </button>
          </div>

          {/* Kelompok 2: Opsi Warna Mode Tinta & Kertas (Tampilan Visual Berbeda: Gelap vs Putih) */}
          <div style={{ display: 'inline-flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsInkSaver(false)}
              style={{
                border: !isInkSaver ? '1.5px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.15)',
                background: '#18181b',
                color: '#f4f4f5',
                padding: '5px 12px',
                borderRadius: 'var(--r-pill)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: !isInkSaver ? '0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
              <span>Latar Gelap</span>
            </button>

            <button
              type="button"
              onClick={() => setIsInkSaver(true)}
              style={{
                border: isInkSaver ? '1.5px solid var(--accent)' : '1px solid #d4d4d8',
                background: '#ffffff',
                color: '#0f172a',
                padding: '5px 12px',
                borderRadius: 'var(--r-pill)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isInkSaver ? '0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
              <span>Hemat Tinta (Putih)</span>
            </button>
          </div>
        </div>

        {/* Petunjuk Cetak Tanpa Emoji */}
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
          <span style={{ color: 'var(--accent)', fontWeight: 800 }}>•</span>
          <span>
            Di jendela dialog cetak printer: pilih kertas <b>A4</b>, margin <b>Nol</b>, dan centang opsi <b>Grafik latar belakang</b>.
          </span>
        </div>

        {/* Area Dokumen Cetak yang Mendukung Scroll Penuh 4 Halaman A4 */}
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
