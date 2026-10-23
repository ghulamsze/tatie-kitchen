import React from 'react';
import { DeviceInfo, setDeviceOverride } from '../../lib/device/detect.ts';
import { Button } from '../../design/components/Button.tsx';

export interface LaptopPlaceholderProps {
  device: DeviceInfo;
}

export const LaptopPlaceholder: React.FC<LaptopPlaceholderProps> = ({ device }) => {
  return (
    <div
      className="scr"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        className="g-acrylic"
        style={{
          maxWidth: '560px',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <span
          style={{
            fontSize: 'var(--t-xs)',
            lineHeight: 'var(--l-xs)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--accent)',
            background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
            padding: '4px 12px',
            borderRadius: '999px',
          }}
        >
          Sistem Admin Laptop
        </span>

        <h1
          style={{
            fontSize: 'var(--t-xl)',
            lineHeight: 'var(--l-xl)',
            fontWeight: 800,
            margin: 0,
          }}
        >
          Tati’e Kitchen untuk Laptop
        </h1>

        <p
          style={{
            fontSize: 'var(--t-md)',
            lineHeight: 'var(--l-md)',
            color: 'var(--ink-2)',
            margin: 0,
          }}
        >
          Versi sistem admin web laptop dan berkas .exe belum tersedia pada fase ini. Saat ini fokus pengembangan adalah aplikasi tablet kasir.
        </p>

        {/* Informasi Perangkat Terdeteksi */}
        <div
          style={{
            width: '100%',
            background: 'var(--ctl)',
            border: '1px solid var(--ctl-line)',
            borderRadius: 'var(--r-md)',
            padding: '12px 16px',
            textAlign: 'left',
            fontSize: 'var(--t-xs)',
            lineHeight: 'var(--l-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            marginTop: '8px',
          }}
        >
          <div><b>Platform terdeteksi:</b> {device.platform}</div>
          <div><b>Bentuk perangkat:</b> {device.formFactor}</div>
          <div><b>Sumber deteksi:</b> {device.source}</div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <Button
            variant="lime"
            onClick={() => setDeviceOverride('tablet')}
            style={{ width: '100%' }}
          >
            Buka Simulasi Tablet Kasir (1024 × 640)
          </Button>
          <Button
            variant="flat"
            onClick={() => setDeviceOverride('phone')}
            style={{ width: '100%' }}
          >
            Buka Simulasi HP Pemilik (Portrait)
          </Button>
          <span style={{ fontSize: 'var(--t-xs)', lineHeight: 'var(--l-xs)', color: 'var(--ink-3)' }}>
            Gunakan ?device=tablet atau ?device=phone untuk simulasi di laptop.
          </span>
        </div>
      </div>
    </div>
  );
};
