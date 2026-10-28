import React, { useState, useEffect, useCallback } from 'react';
import { FormFactor, Platform, setDeviceOverride } from '../lib/device/detect.ts';

export interface WebDevControlsProps {
  currentMode: FormFactor;
  currentPlatform?: Platform;
}

export const WebDevControls: React.FC<WebDevControlsProps> = ({ currentMode, currentPlatform }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Gagal mengubah mode layar penuh:', err);
    }
  }, []);

  const isTabletActive = currentMode === 'tablet' || currentMode === 'laptop';
  const isIosActive = currentMode === 'phone' && currentPlatform === 'ios';
  const isAndroidActive = currentMode === 'phone' && !isIosActive;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(22, 18, 19, 0.74)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        padding: '4px',
        borderRadius: '999px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        userSelect: 'none',
      }}
    >
      {/* 1. Tombol Mode Tablet */}
      <button
        type="button"
        onClick={() => setDeviceOverride('tablet')}
        title="Mode Tablet POS (1024x640)"
        aria-label="Mode Tablet POS"
        style={{
          border: 'none',
          background: isTabletActive ? 'var(--accent)' : 'transparent',
          color: isTabletActive ? 'var(--on-accent)' : 'var(--ink-2)',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          padding: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <circle cx="12" cy="18" r="0.5" fill="currentColor" />
        </svg>
      </button>

      {/* 2. Tombol Mode Android HP */}
      <button
        type="button"
        onClick={() => setDeviceOverride('phone', 'android')}
        title="Mode Android HP"
        aria-label="Mode Android HP"
        style={{
          border: 'none',
          background: isAndroidActive ? 'var(--accent)' : 'transparent',
          color: isAndroidActive ? 'var(--on-accent)' : 'var(--ink-2)',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          padding: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M12 18h.01" />
        </svg>
      </button>

      {/* 3. Tombol Mode iOS / iPhone */}
      <button
        type="button"
        onClick={() => setDeviceOverride('phone', 'ios')}
        title="Mode iOS / iPhone"
        aria-label="Mode iOS / iPhone"
        style={{
          border: 'none',
          background: isIosActive ? 'var(--accent)' : 'transparent',
          color: isIosActive ? 'var(--on-accent)' : 'var(--ink-2)',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          padding: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="4" />
          <line x1="10" y1="5" x2="14" y2="5" />
          <line x1="10" y1="20" x2="14" y2="20" />
        </svg>
      </button>

      {/* Pemisah Vertikal Halus */}
      <div
        style={{
          width: '1px',
          height: '18px',
          background: 'rgba(255, 255, 255, 0.15)',
          margin: '0 2px',
        }}
      />

      {/* Tombol Fullscreen (Hanya Icon, Tanpa Teks) */}
      <button
        type="button"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        style={{
          border: 'none',
          background: isFullscreen ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
          color: isFullscreen ? 'var(--ink)' : 'var(--ink-2)',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          padding: 0,
        }}
      >
        {isFullscreen ? (
          /* Icon Keluar Layar Penuh (Minimize/Compress) */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          /* Icon Masuk Layar Penuh (Expand) */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>
    </div>
  );
};
