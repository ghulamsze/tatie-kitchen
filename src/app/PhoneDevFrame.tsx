import React, { useState, useEffect, useRef } from 'react';
import { DeviceInfo, setDeviceOverride } from '../lib/device/detect.ts';

export interface PhoneDevFrameProps {
  device: DeviceInfo;
  children: React.ReactNode;
}

export const PhoneDevFrame: React.FC<PhoneDevFrameProps> = ({ device, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [isWideScreen, setIsWideScreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 500 : true;
  });

  const isFrameEnabled =
    !device.native &&
    device.formFactor === 'phone' &&
    isWideScreen &&
    (import.meta.env.DEV || import.meta.env.VITE_BETA_FRAME === '1');

  useEffect(() => {
    const handleResize = () => {
      const wide = window.innerWidth > 500;
      setIsWideScreen(wide);

      if (wide) {
        const availableWidth = window.innerWidth - 32;
        const availableHeight = window.innerHeight - 32;

        const scaleX = availableWidth / 390;
        const scaleY = availableHeight / 800;
        const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1);
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isFrameEnabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: '#070a0e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Pemilih Perangkat di Browser Web Laptop (Di luar canvas layar aplikasi) */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '4px',
          borderRadius: '999px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <button
          type="button"
          onClick={() => setDeviceOverride('tablet')}
          title="Tablet Kasir"
          aria-label="Mode Tablet"
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--ink-2)',
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
        <button
          type="button"
          onClick={() => setDeviceOverride('phone')}
          title="Android HP"
          aria-label="Mode Android HP"
          style={{
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
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
      </div>
      <div
        className="phone-dev-frame-wrapper"
        style={{
          width: `${390 * scale}px`,
          height: `${800 * scale}px`,
          position: 'relative',
        }}
      >
        <div
          className="phone-dev-frame-inner"
          style={{
            width: '390px',
            height: '800px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            borderRadius: 'var(--r-xl)',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.15)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--scr-bg)',
            contain: 'paint',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
