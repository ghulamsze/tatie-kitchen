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

    // Blokir scroll browser global saat DevFrame aktif
  useEffect(() => {
    if (!isBetaFrameEnabled) return;
    const blockWheel = (e: WheelEvent) => e.preventDefault();
    document.addEventListener('wheel', blockWheel, { passive: false });
    return () => document.removeEventListener('wheel', blockWheel);
  }, [isBetaFrameEnabled]);
  const handleResize = () => {
      // 1024 x 640 ditambah margin padding
      const availableWidth = window.innerWidth - 32;
      const availableHeight = window.innerHeight - 84; // Menyisakan ruang untuk bilah info simulasi

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
      {/* Bilah Kontrol Simulasi DevFrame */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: `${1024 * scale}px`,
          maxWidth: '100%',
          marginBottom: '12px',
          padding: '6px 16px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          fontSize: 'var(--t-xs)',
          lineHeight: 'var(--l-xs)',
          color: '#ffffff',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 6px var(--accent)',
            }}
          />
          <b>Simulasi Tablet Kasir</b>
          <span style={{ opacity: 0.6 }}>1024 × 640 (Skala {Math.round(scale * 100)}%)</span>
        </div>

        {/* Pengalih Cepat Perangkat */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ opacity: 0.6, marginRight: '4px' }}>Ubah Perangkat:</span>
          {(['tablet', 'laptop', 'phone', 'auto'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDeviceOverride(m)}
              style={{
                background:
                  (m === 'auto' && device.source !== 'override') ||
                  (device.source === 'override' && device.formFactor === m)
                    ? 'var(--accent)'
                    : 'rgba(255, 255, 255, 0.12)',
                color:
                  (m === 'auto' && device.source !== 'override') ||
                  (device.source === 'override' && device.formFactor === m)
                    ? 'var(--on-accent)'
                    : '#ffffff',
                border: 'none',
                borderRadius: '999px',
                padding: '2px 10px',
                fontFamily: 'inherit',
                fontSize: 'var(--t-xs)',
                lineHeight: 'var(--l-xs)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {m === 'tablet' ? 'Tablet' : m === 'laptop' ? 'Laptop' : m === 'phone' ? 'Ponsel' : 'Otomatis'}
            </button>
          ))}
        </div>
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
