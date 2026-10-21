import React from 'react';
import { Button } from './Button.tsx';

export interface NoInternetNoticeProps {
  variant?: 'banner' | 'dialog';
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const NoInternetNotice: React.FC<NoInternetNoticeProps> = ({
  variant = 'banner',
  onRetry,
  onDismiss,
}) => {
  if (variant === 'banner') {
    return (
      <div className="tk-no-internet-banner" role="alert">
        <span className="tk-no-internet-dot" aria-hidden="true" />
        <span>Koneksi terputus · Mode offline</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              fontSize: 'var(--t-xs)',
              lineHeight: 'var(--l-xs)',
              fontWeight: 800,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px 8px',
            }}
          >
            Coba lagi
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="tk-overlay">
      <div className="g-liquid tk-dialog" role="dialog" aria-modal="true">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="tk-no-internet-dot" style={{ width: '14px', height: '14px' }} />
          <span style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800 }}>
            Koneksi Internet Terputus
          </span>
        </div>
        <div style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)' }}>
          Tablet tidak dapat terhubung ke server Supabase. Pastikan koneksi Wi-Fi toko aktif untuk melanjutkan transaksi online.
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          {onDismiss && (
            <Button variant="flat" size="md" onClick={onDismiss} style={{ flex: 1 }}>
              Tutup
            </Button>
          )}
          {onRetry && (
            <Button variant="lime" size="md" onClick={onRetry} style={{ flex: 1 }}>
              Coba lagi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
