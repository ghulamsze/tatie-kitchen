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
  const [isAndroidConfirmOpen, setIsAndroidConfirmOpen] = useState(false);

  // Tanpa notifikasi toast di HP / iOS
  const showToast = (_msg?: string) => {};

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

  const isWindows = typeof navigator !== 'undefined' && /Windows NT|Win32|Win64|Windows/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch('/assets/docs/tatie-kitchen-menu.pdf');
      const blob = await res.blob();

      // Jika mendeteksi Windows Desktop: unduh langsung via link Blob URL tanpa membuka share sheet sistem
      if (isWindows) {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'tatie-kitchen-menu.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);
        showToast('Berkas PDF menu berhasil diunduh ke folder Downloads');
        setIsAndroidConfirmOpen(false);
        return;
      }

      // Untuk Android / iOS: gunakan Share API jika didukung (agar bisa disimpan ke Files / dibagikan ke percetakan)
      const file = new File([blob], 'tatie-kitchen-menu.pdf', { type: 'application/pdf' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Menu Tati’e Kitchen (A4)',
            files: [file],
          });
          showToast('Berkas PDF menu berhasil disimpan / dibagikan');
          setIsAndroidConfirmOpen(false);
          return;
        } catch (err: unknown) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }

      // Fallback standar via Blob URL
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'tatie-kitchen-menu.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);

      showToast('Berkas PDF menu tersimpan di perangkat Anda');
      setIsAndroidConfirmOpen(false);
    } catch {
      window.open('/assets/docs/tatie-kitchen-menu.pdf', '_blank');
      showToast('Membuka berkas PDF menu...');
      setIsAndroidConfirmOpen(false);
    }
  };

  const executeSystemPrint = () => {
    setIsAndroidConfirmOpen(false);
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      document.body.classList.add('is-printing-menu');
      setTimeout(() => {
        try {
          window.print();
        } finally {
          setTimeout(() => {
            document.body.classList.remove('is-printing-menu');
          }, 1500);
        }
      }, 80);
    }
  };

  const handleCetakDokumenA4 = async () => {
    // Jika di Android di mana window.print sering tidak didukung atau terblokir:
    if (isAndroid) {
      setIsAndroidConfirmOpen(true);
      return;
    }

    // Coba picu cetak sistem bawaan browser (Windows / iOS / macOS)
    let printFired = false;
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      try {
        document.body.classList.add('is-printing-menu');

        const onBeforePrint = () => { printFired = true; };
        window.addEventListener('beforeprint', onBeforePrint);

        window.print();
        printFired = true;

        setTimeout(() => {
          window.removeEventListener('beforeprint', onBeforePrint);
          document.body.classList.remove('is-printing-menu');
        }, 1500);
      } catch {
        printFired = false;
      }
    }

    // Jika tidak terjadi sesuatu (window.print diblokir atau gagal):
    // Sistem otomatis mengarahkan untuk unduh berkas PDF nya
    if (!printFired) {
      showToast('Pencetakan tidak merespons, otomatis mengunduh PDF...');
      await handleDownloadPdf();
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

                {/* Tombol Aksi Tunggal: Cetak dokumen A4 (Otomatis unduh PDF jika tidak ada respons cetak) */}
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="tk-btn-lime"
                    onClick={handleCetakDokumenA4}
                    style={{
                      width: '100%',
                      height: '46px',
                      fontSize: 'var(--t-xs)',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    <span>Cetak dokumen A4</span>
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>

        {/* 3. Area Pratinjau Dokumen Cetak A4 */}
        <div
          onScroll={(e) => {
            const st = e.currentTarget.scrollTop;
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

        {/* Dialog Otomatis Konfirmasi Simpan PDF untuk Android */}
        {isAndroidConfirmOpen && (
          <div
            className="tk-phone-overlay ov"
            onClick={() => setIsAndroidConfirmOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Konfirmasi Simpan Berkas PDF Menu"
            style={{ zIndex: 120 }}
          >
            <div
              className="g-liquid tk-phone-dialog"
              onClick={(e) => e.stopPropagation()}
              style={{ gap: '14px', maxWidth: '340px' }}
            >
              <b style={{ fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)', fontWeight: 800, color: 'var(--ink)' }}>
                Simpan Berkas PDF Menu?
              </b>
              <span style={{ fontSize: 'var(--t-xs)', lineHeight: '1.4', color: 'var(--ink-2)' }}>
                Di sebagian perangkat Android pencetakan langsung lewat browser terkendala. Anda dapat menyimpan berkas .pdf menu langsung ke perangkat untuk dibawa atau dicetak manual di percetakan.
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="tk-btn-lime"
                  onClick={handleDownloadPdf}
                  style={{ width: '100%', height: '46px', fontSize: 'var(--t-xs)', fontWeight: 800 }}
                >
                  Simpan Berkas .PDF
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="tk-btn-flat"
                    onClick={() => setIsAndroidConfirmOpen(false)}
                    style={{ flex: 1, height: '40px', fontSize: 'var(--t-xs)' }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="tk-btn-flat"
                    onClick={executeSystemPrint}
                    style={{ flex: 1, height: '40px', fontSize: 'var(--t-xs)' }}
                  >
                    Coba Cetak
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PhonePrintMenuPreview;
