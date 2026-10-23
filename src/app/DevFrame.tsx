import React, { useState, useEffect, useRef } from 'react';
import { DeviceInfo, setDeviceOverride } from '../lib/device/detect.ts';

export interface DevFrameProps {
  device: DeviceInfo;
  children: React.ReactNode;
}

export const DevFrame: React.FC<DevFrameProps> = ({ device, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  // DevFrame aktif jika bukan native dan (mode dev atau VITE_BETA_FRAME=1) dan formFactor tablet
  const isBetaFrameEnabled =
    !device.native &&
    (import.meta.env.DEV || import.meta.env.VITE_BETA_FRAME === '1') &&
    device.formFactor === 'tablet';

  useEffect(() => {
    if (!isBetaFrameEnabled) return;

    const handleResize = () => {
      // 1024 x 640 ditambah margin padding
      const availableWidth = window.innerWidth - 32;
      const availableHeight = window.innerHeight - 32;

      const scaleX = availableWidth / 1024;
      const scaleY = availableHeight / 640;
      const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1);
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isBetaFrameEnabled]);

  if (!isBetaFrameEnabled) {
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
          style={{
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Tablet
        </button>
        <button
          type="button"
          onClick={() => setDeviceOverride('phone')}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--ink-2)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Android HP
        </button>
      </div>
      {/* Bingkai Tablet 1024 x 640 */}
      <div
        className="dev-frame-wrapper"
        style={{
          width: `${1024 * scale}px`,
          height: `${640 * scale}px`,
          position: 'relative',
        }}
      >
        <div
          className="dev-frame-inner"
          style={{
            width: '1024px',
            height: '640px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.15)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
