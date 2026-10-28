/**
 * secureSession.ts
 * Utilitas manajemen URL perangkat aman dengan format:
 * - Tablet:  https://tatie-kitchen.vercel.app/device?tablet=yvLa4jUyFQo
 * - Android: https://tatie-kitchen.vercel.app/device?android=9EDkRsnA2hb
 * - iOS:     https://tatie-kitchen.vercel.app/device?iPhone=ZAumjuLlihJ&
 * Dijalankan setiap inisialisasi / refresh halaman agar token URL selalu acak dan terlindungi.
 */

import { hasCaseInsensitiveParam, getCaseInsensitiveParam, DEVICE_OVERRIDE_KEY } from '../device/detect.ts';

// Gunakan karakter alfanumerik bersih (Base62) agar rapi dan bebas dari karakter canggung
const SECURE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SECURE_TOKEN_STORAGE_KEY = 'tk_secure_device_token';
const SECURE_TOKEN_TIME_KEY = 'tk_secure_device_time';

/**
 * Menghasilkan token acak kriptografis 11-karakter alfanumerik (contoh: `bFlLqX3QaRw`).
 */
export function generateSecureToken(length = 11): string {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += SECURE_CHARS[bytes[i] % SECURE_CHARS.length];
  }
  return result;
}

/**
 * Mendapatkan token acak sesi perangkat saat ini dari sessionStorage
 */
export function getSecureDeviceToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SECURE_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** @deprecated alias untuk kompatibilitas */
export const getSecureSessionToken = getSecureDeviceToken;
export const getSecureSubdomainToken = getSecureDeviceToken;

/**
 * Mendeteksi formFactor dan platform perangkat aktif dari URL atau localStorage
 */
function resolveCurrentDeviceKey(params: URLSearchParams): 'tablet' | 'android' | 'iPhone' | 'laptop' {
  // 1. Cek parameter eksplisit di URL (case-insensitive)
  if (hasCaseInsensitiveParam(params, 'tablet') || params.get('device')?.toLowerCase() === 'tablet') {
    return 'tablet';
  }
  if (
    hasCaseInsensitiveParam(params, 'iphone') ||
    hasCaseInsensitiveParam(params, 'ios') ||
    params.get('device')?.toLowerCase() === 'iphone' ||
    params.get('device')?.toLowerCase() === 'ios'
  ) {
    return 'iPhone';
  }
  if (hasCaseInsensitiveParam(params, 'android') || params.get('device')?.toLowerCase() === 'android') {
    return 'android';
  }
  if (hasCaseInsensitiveParam(params, 'phone') || params.get('device')?.toLowerCase() === 'phone') {
    const p = params.get('platform')?.toLowerCase();
    if (p === 'ios') return 'iPhone';
    if (p === 'android') return 'android';
    if (typeof navigator !== 'undefined' && /iPhone|iPod/i.test(navigator.userAgent || '')) {
      return 'iPhone';
    }
    return 'android';
  }
  if (hasCaseInsensitiveParam(params, 'laptop') || params.get('device')?.toLowerCase() === 'laptop') {
    return 'laptop';
  }

  // 2. Cek ponsel fisik nyata (iPhone, iPod, ponsel Android)
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    const isIPhone = /iPhone|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const shortestSide = typeof window !== 'undefined' && window.screen
      ? Math.min(window.screen.width, window.screen.height)
      : 0;

    if (isIPhone) {
      try { localStorage.removeItem(DEVICE_OVERRIDE_KEY); } catch {}
      return 'iPhone';
    }
    if (isAndroid || (shortestSide > 0 && shortestSide < 600 && (/Mobile/i.test(ua) || navigator.maxTouchPoints > 0))) {
      try { localStorage.removeItem(DEVICE_OVERRIDE_KEY); } catch {}
      return 'android';
    }
  }

  // 3. Cek localStorage untuk switch dev di desktop
  try {
    const stored = localStorage.getItem(DEVICE_OVERRIDE_KEY);
    const storedPlatform = localStorage.getItem('tk-platform');
    if (stored === 'tablet') return 'tablet';
    if (stored === 'laptop') return 'laptop';
    if (stored === 'phone') {
      if (storedPlatform === 'ios') return 'iPhone';
      return 'android';
    }
  } catch {}

  // 4. Fallback berdasarkan dimensi fisik layar (default desktop Windows adalah Tablet POS)
  if (typeof window !== 'undefined') {
    const physShortest = window.screen
      ? Math.min(window.screen.width, window.screen.height)
      : Math.min(window.innerWidth, window.innerHeight);
    if (physShortest < 600) return 'android';
    return 'tablet';
  }

  return 'tablet';
}

/**
 * Inisialisasi format URL perangkat acak setiap kali halaman dibuka atau di-refresh.
 * Menghasilkan format persis:
 * - Tablet:  https://tatie-kitchen.vercel.app/device?tablet=yvLa4jUyFQo
 * - Android: https://tatie-kitchen.vercel.app/device?android=9EDkRsnA2hb
 * - iOS:     https://tatie-kitchen.vercel.app/device?iPhone=ZAumjuLlihJ&
 */
export function initSecureUrlSession(): string {
  if (typeof window === 'undefined') {
    return generateSecureToken(11);
  }

  try {
    // Abaikan rute developer galeri
    if (window.location.pathname.startsWith('/dev/')) {
      return generateSecureToken(11);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();
    if (isNative) {
      return generateSecureToken(11);
    }

    const currentUrl = new URL(window.location.href);
    const searchParams = currentUrl.searchParams;

    // Tentukan perangkat aktif ('tablet' | 'android' | 'iPhone' | 'laptop')
    const deviceKey = resolveCurrentDeviceKey(searchParams);

    // Simpan ke localStorage agar konsisten di seluruh aplikasi
    try {
      if (deviceKey === 'iPhone') {
        localStorage.setItem(DEVICE_OVERRIDE_KEY, 'phone');
        localStorage.setItem('tk-platform', 'ios');
      } else if (deviceKey === 'android') {
        localStorage.setItem(DEVICE_OVERRIDE_KEY, 'phone');
        localStorage.setItem('tk-platform', 'android');
      } else if (deviceKey === 'tablet') {
        localStorage.setItem(DEVICE_OVERRIDE_KEY, 'tablet');
        localStorage.removeItem('tk-platform');
      } else if (deviceKey === 'laptop') {
        localStorage.setItem(DEVICE_OVERRIDE_KEY, 'laptop');
        localStorage.removeItem('tk-platform');
      }
    } catch {}

    // Gunakan token yang sudah diberikan di URL jika ada (misal android=9EDkRsnA2hb, iPhone=ZAumjuLlihJ, tablet=yvLa4jUyFQo)
    let existingToken: string | null = null;
    const directVal = getCaseInsensitiveParam(searchParams, deviceKey);
    if (directVal && directVal.trim().length >= 6) {
      existingToken = directVal.trim();
    } else {
      for (const [key, val] of searchParams.entries()) {
        const lowerKey = key.toLowerCase();
        if (['tablet', 'android', 'iphone', 'ios', 'phone', 'laptop'].includes(lowerKey)) {
          if (val && val.trim().length >= 6) {
            existingToken = val.trim();
            break;
          }
        }
      }
    }

    const token = existingToken && existingToken.length >= 6
      ? existingToken
      : generateSecureToken(11);

    // Susun URL sesuai format presisi yang diminta
    let newRelativeUrl = '';
    if (deviceKey === 'iPhone') {
      newRelativeUrl = `/device?iPhone=${token}&`;
    } else if (deviceKey === 'android') {
      newRelativeUrl = `/device?android=${token}`;
    } else if (deviceKey === 'tablet') {
      newRelativeUrl = `/device?tablet=${token}`;
    } else {
      newRelativeUrl = `/device?${deviceKey}=${token}`;
    }

    // Perbarui URL di address bar browser secara instan tanpa reload ulang
    window.history.replaceState(null, '', newRelativeUrl);

    // Simpan ke sessionStorage
    try {
      sessionStorage.setItem(SECURE_TOKEN_STORAGE_KEY, token);
      sessionStorage.setItem(SECURE_TOKEN_TIME_KEY, Date.now().toString());
    } catch {}

    return token;
  } catch (err) {
    console.warn('[secureSession] Gagal menginisialisasi URL session:', err);
    return generateSecureToken(11);
  }
}
