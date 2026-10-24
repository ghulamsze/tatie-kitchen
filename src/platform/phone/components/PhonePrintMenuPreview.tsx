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
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);

  // Pastikan class modal terpasang saat preview aktif
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
        className="tk-phone-print-preview"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--scr-bg)',
        }}
      >
        {/* Bagian Atas: Navigasi dan Pengaturan Cetak (Menjadi Dropdown saat Scroll tanpa Fade) */}
        <div
          style={{
            zIndex: 10,
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        >
          {/* 1. Navigasi Kembali di Kiri Atas (100% Konsisten dengan Layar Rincian: ‹  Cetak menu) */}
          <div style={{ margin: '8px 16px 14px 16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-2)',
                fontSize: 'var(--t-sm)',
                lineHeight: 'var(--l-sm)',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>‹</span>
              <span>Cetak menu</span>
            </button>
          </div>

          {/* 2. Kartu Pengaturan Berdesain Akrilik (Dropdown Menu) */}
          <div
            className="g-acrylic"
            style={{
              borderRadius: 'var(--r-xl)',
              padding: isSettingsOpen ? '16px 20px' : '12px 18px',
              margin: '0 16px 12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: isSettingsOpen ? '14px' : '0px',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
            }}
          >
            {/* Header Dropdown Trigger: Hanya Teks Pengaturan Dokumen Cetak dan Tanda Panah */}
            <div
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              role="button"
              tabIndex={0}
              aria-expanded={isSettingsOpen}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setIsSettingsOpen(!isSettingsOpen);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <b style={{ fontSize: 'var(--t-sm)', color: 'var(--ink)', fontWeight: 700 }}>
                Pengaturan Dokumen Cetak
              </b>
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--ink-2)',
                  display: 'inline-block',
                  transform: isSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                ▾
              </span>
            </div>

            {/* Isi Menu Pengaturan Dropdown (Mempertahankan seluruh kontrol pada gambar) */}
            {isSettingsOpen && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  paddingTop: '6px',
                }}
              >
                {/* Opsi Tata Letak Margin */}
                <div>
                  <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    Tata Letak Margin
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsMargin4433(false)}
                      style={{
                        height: '42px',
                        borderRadius: 'var(--r-md)',
                        border: !isMargin4433 ? '1.5px solid var(--accent)' : '1px solid var(--ctl-line)',
                        background: !isMargin4433 ? 'color-mix(in srgb, var(--accent) 15%, var(--ctl))' : 'var(--ctl)',
                        color: 'var(--ink)',
                        fontSize: 'var(--t-xs)',
                        fontWeight: 700,
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
                        height: '42px',
                        borderRadius: 'var(--r-md)',
                        border: isMargin4433 ? '1.5px solid var(--accent)' : '1px solid var(--ctl-line)',
                        background: isMargin4433 ? 'color-mix(in srgb, var(--accent) 15%, var(--ctl))' : 'var(--ctl)',
                        color: 'var(--ink)',
                        fontSize: 'var(--t-xs)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Margin 4433
                    </button>
                  </div>
                </div>

                {/* Opsi Mode Tinta & Latar Belakang */}
                <div>
                  <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    Mode Tinta & Latar Belakang
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsInkSaver(false)}
                      style={{
                        height: '42px',
                        borderRadius: 'var(--r-md)',
                        border: !isInkSaver ? '1.5px solid var(--accent)' : '1px solid var(--ctl-line)',
                        background: !isInkSaver ? '#141416' : 'var(--ctl)',
                        color: !isInkSaver ? '#ffffff' : 'var(--ink-2)',
                        fontSize: 'var(--t-xs)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                      <span>Latar Gelap</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInkSaver(true)}
                      style={{
                        height: '42px',
                        borderRadius: 'var(--r-md)',
                        border: isInkSaver ? '1.5px solid var(--accent)' : '1px solid var(--ctl-line)',
                        background: isInkSaver ? '#ffffff' : 'var(--ctl)',
                        color: isInkSaver ? '#0f172a' : 'var(--ink-2)',
                        fontSize: 'var(--t-xs)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
                      <span>Hemat Tinta</span>
                    </button>
                  </div>
                </div>

                {/* Tombol Eksekusi Cetak Dokumen A4 */}
                <button
                  type="button"
                  className="tk-btn-flat"
                  onClick={handlePrint}
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  <span>Cetak dokumen A4</span>
                </button>
              </div>
            )}
          </div>
      </div>

        {/* 3. Area Pratinjau Dokumen Cetak A4 */}
        <div
          onScroll={(e) => {
            const st = e.currentTarget.scrollTop;
            setScrollTop(st);
            if (st > 20 && isSettingsOpen) {
              setIsSettingsOpen(false);
            } else if (st <= 5 && !isSettingsOpen) {
              setIsSettingsOpen(true);
            }
          }}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px 8px 60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            scrollSnapType: 'y proximity',
            scrollPaddingTop: '16px',
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
