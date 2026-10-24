import React, { useState, useEffect } from 'react';
import { DeviceInfo } from './detect.ts';

const DEVICE_ID_KEY = 'tk_pos_unique_device_id';
const AUTHORIZED_TOKEN_KEY = 'tk_authorized_device_token';
const DEFAULT_AUTH_PIN = '1234';
const BACKUP_AUTH_PIN = '2026';

export function getOrGeneratePosDeviceId(): string {
  if (typeof window === 'undefined') return 'TK-SRV-0001';
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      const randPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      id = `TK-${randPart1}-${randPart2}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'TK-FALLBACK';
  }
}

export function isSubdomainAccess(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.()) {
    return false;
  }
  return true;
}

export function isDeviceAuthorized(deviceId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const token = localStorage.getItem(AUTHORIZED_TOKEN_KEY);
    return token === deviceId;
  } catch {
    return false;
  }
}

export function authorizeCurrentDevice(deviceId: string): void {
  try {
    localStorage.setItem(AUTHORIZED_TOKEN_KEY, deviceId);
  } catch {}
}

export interface SubdomainDeviceGuardProps {
  device: DeviceInfo;
  children: React.ReactNode;
}

export const SubdomainDeviceGuard: React.FC<SubdomainDeviceGuardProps> = ({
  device,
  children,
}) => {
  const [deviceId, setDeviceId] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // 1. Pengecualian laptop: perangkat laptop/desktop bebas akses tanpa kunci
    if (device.formFactor === 'laptop') {
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }

    // 2. Jika bukan di subdomain (misal localhost / dev / native APK), tidak perlu kunci
    if (!isSubdomainAccess()) {
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }

    // 3. Di subdomain untuk tablet / android hp: generate ID unik acak per device
    const id = getOrGeneratePosDeviceId();
    setDeviceId(id);
    const authorized = isDeviceAuthorized(id);
    setIsAuthorized(authorized);
    setIsChecking(false);
  }, [device.formFactor]);

  if (isChecking) {
    return null;
  }

  // Jika diizinkan atau pengecualian laptop
  if (isAuthorized) {
    return <>{children}</>;
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (cleanPin === DEFAULT_AUTH_PIN || cleanPin === BACKUP_AUTH_PIN) {
      authorizeCurrentDevice(deviceId);
      setIsAuthorized(true);
      setErrorMsg('');
    } else {
      setErrorMsg('PIN otorisasi tidak valid.');
      setPinInput('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#0a0a0f',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.22) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(24, 24, 30, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 20px',
            color: '#f87171',
            fontSize: '24px',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Akses Perangkat Terkunci
        </h2>

        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 20px 0' }}>
          Perangkat ini belum diotorisasi untuk menjalankan POS kasir Tati’e Kitchen melalui subdomain.
        </p>

        {/* Device ID Badge */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ID Perangkat Anda
          </span>
          <b style={{ fontSize: '15px', color: '#e2e8f0', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
            {deviceId}
          </b>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            maxLength={6}
            placeholder="Masukkan PIN Otorisasi"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            style={{
              width: '100%',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '16px',
              textAlign: 'center',
              letterSpacing: '0.25em',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <button
            type="submit"
            disabled={!pinInput.trim()}
            style={{
              height: '48px',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: pinInput.trim() ? 'pointer' : 'not-allowed',
              opacity: pinInput.trim() ? 1 : 0.5,
              transition: 'opacity 0.15s ease',
            }}
          >
            Otorisasi Perangkat Ini
          </button>
        </form>

        <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '16px' }}>
          Pengecualian: Akses langsung diizinkan pada Laptop/Desktop.
        </span>
      </div>
    </div>
  );
};
