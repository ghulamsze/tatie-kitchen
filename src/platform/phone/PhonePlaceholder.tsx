import React from 'react';
import { DeviceInfo, setDeviceOverride } from '../../lib/device/detect.ts';
import { Button } from '../../design/components/Button.tsx';

export interface PhonePlaceholderProps {
  device: DeviceInfo;
}

export const PhonePlaceholder: React.FC<PhonePlaceholderProps> = ({ device }) => {
  return (
    <div
      className="scr"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <div
        className="g-acrylic"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '32px 20px',
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
          Aplikasi Ponsel Pemilik
        </span>

        <h1
          style={{
            fontSize: 'var(--t-lg)',
            lineHeight: 'var(--l-lg)',
            fontWeight: 800,
            margin: 0,
          }}
        >
          Tati’e Kitchen untuk Ponsel
        </h1>

        <p
          style={{
            fontSize: 'var(--t-sm)',
            lineHeight: 'var(--l-sm)',
            color: 'var(--ink-2)',
            margin: 0,
          }}
        >
          Aplikasi untuk ponsel Android dan iOS pemilik belum tersedia pada fase ini. Saat ini fokus pengembangan adalah aplikasi tablet kasir.
        </p>

        {/* Informasi Perangkat Terdeteksi */}
        <div
          style={{
            width: '100%',
            background: 'var(--ctl)',
            border: '1px solid var(--ctl-line)',
            borderRadius: 'var(--r-md)',
            padding: '12px 14px',
            textAlign: 'left',
            fontSize: 'var(--t-xs)',
            lineHeight: 'var(--l-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div><b>Platform:</b> {device.platform}</div>
          <div><b>Bentuk:</b> {device.formFactor}</div>
          <div><b>Sumber:</b> {device.source}</div>
        </div>

        <Button
          variant="lime"
          size="md"
          onClick={() => setDeviceOverride('tablet')}
          style={{ width: '100%', marginTop: '8px' }}
        >
          Buka Mode Tablet Kasir
        </Button>
      </div>
    </div>
  );
};
