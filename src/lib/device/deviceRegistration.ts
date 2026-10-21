import { DeviceInfo } from './detect.ts';

export interface RegisteredDevice {
  id: string;
  name: string;
  platform: string;
  formFactor: string;
  userAgent: string;
  lastSeenAt: string;
}

const DEVICE_ID_KEY = 'tk-registered-device-id';

export function getOrRegisterDeviceId(): string {
  if (typeof window === 'undefined') return 'server-dev';
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'fallback-dev';
  }
}

export function registerDevice(info: DeviceInfo): RegisteredDevice {
  const id = getOrRegisterDeviceId();
  const reg: RegisteredDevice = {
    id,
    name: `Tablet Kasir (${info.platform})`,
    platform: info.platform,
    formFactor: info.formFactor,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    lastSeenAt: new Date().toISOString(),
  };

  // Simpan status registrasi lokal (di Fase 3 akan dikirim ke tabel Supabase `devices`)
  return reg;
}
