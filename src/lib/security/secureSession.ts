/**
 * secureSession.ts
 * Utilitas manajemen URL perangkat aman dengan format:
 * http://localhost:5173/device?phone=bFlLqX3QaRw (atau ?tablet=... / ?laptop=...).
 * Dijalankan setiap inisialisasi / refresh halaman agar token URL selalu acak dan terlindungi.
 */

// Gunakan karakter alfanumerik bersih (Base62) agar rapi dan bebas dari karakter canggung
const SECURE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SECURE_TOKEN_STORAGE_KEY = 'tk_secure_device_token';
const SECURE_TOKEN_TIME_KEY = 'tk_secure_device_time';
const DEVICE_OVERRIDE_KEY = 'tk-device';

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
 * Mendeteksi formFactor perangkat aktif dari URL atau localStorage
 */
function resolveCurrentDeviceKey(params: URLSearchParams): 'phone' | 'tablet' | 'laptop' {
  // 1. Cek ponsel fisik nyata (iPhone, iPod, ponsel Android)
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    const isIPhone = /iPhone|iPod/i.test(ua);
    const shortestSide = typeof window !== 'undefined' && window.screen
      ? Math.min(window.screen.width, window.screen.height)
      : 0;

    // iPhone atau ponsel fisik berlayar < 600px WAJIB selalu menjadi 'phone'
    if (isIPhone || (shortestSide > 0 && shortestSide < 600 && (/Mobile|Android/i.test(ua) || navigator.maxTouchPoints > 0))) {
      try {
        localStorage.removeItem(DEVICE_OVERRIDE_KEY);
      } catch {
        // ignore
      }
      return 'phone';
    }
  }

  // 2. Cek parameter eksplisit di URL
  if (params.has('phone')) return 'phone';
  if (params.has('tablet')) return 'tablet';
  if (params.has('laptop')) return 'laptop';

  const paramDevice = params.get('device')?.toLowerCase();
  if (paramDevice === 'phone' || paramDevice === 'android' || paramDevice === 'hp' || paramDevice === 'mobile') return 'phone';
  if (paramDevice === 'tablet' || paramDevice === 'tab') return 'tablet';
  if (paramDevice === 'laptop') return 'laptop';

  // 3. Cek localStorage untuk switch dev di desktop
  try {
    const stored = localStorage.getItem(DEVICE_OVERRIDE_KEY);
    if (stored === 'phone' || stored === 'tablet' || stored === 'laptop') {
      return stored;
    }
  } catch {
    // ignore
  }

  // 4. Fallback berdasarkan dimensi fisik layar
  if (typeof window !== 'undefined') {
    const physShortest = window.screen
      ? Math.min(window.screen.width, window.screen.height)
      : Math.min(window.innerWidth, window.innerHeight);
    if (physShortest < 600) return 'phone';
    if (physShortest <= 1180) return 'tablet';
    return 'laptop';
  }

  return 'phone';
}

/**
 * Inisialisasi format URL perangkat acak setiap kali halaman dibuka atau di-refresh.
 * Menghasilkan format persis:
 * `http://localhost:5173/device?phone=bFlLqX3QaRw` (atau tablet/laptop).
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

    // Tentukan perangkat aktif (phone / tablet / laptop)
    const deviceKey = resolveCurrentDeviceKey(searchParams);

    // Simpan ke localStorage agar konsisten di seluruh aplikasi
    try {
      localStorage.setItem(DEVICE_OVERRIDE_KEY, deviceKey);
    } catch {
      // ignore
    }

    // Generate token acak baru setiap kali refresh / initial load
    const freshToken = generateSecureToken(11);

    // Susun parameter URL dengan format `/device?<deviceKey>=<freshToken>`
    const newParams = new URLSearchParams();
    newParams.set(deviceKey, freshToken);

    // Pindahkan parameter custom lain jika ada
    searchParams.forEach((val, key) => {
      if (
        key !== 'phone' &&
        key !== 'tablet' &&
        key !== 'laptop' &&
        key !== 'device' &&
        key !== 'subdomain' &&
        key !== 'v'
      ) {
        newParams.set(key, val);
      }
    });

    const newRelativeUrl = `/device?${newParams.toString()}`;

    // Perbarui URL di address bar browser secara instan tanpa reload ulang
    window.history.replaceState(null, '', newRelativeUrl);

    // Simpan ke sessionStorage
    try {
      sessionStorage.setItem(SECURE_TOKEN_STORAGE_KEY, freshToken);
      sessionStorage.setItem(SECURE_TOKEN_TIME_KEY, Date.now().toString());
    } catch {
      // ignore
    }

    return freshToken;
  } catch (err) {
    console.warn('[secureSession] Gagal menginisialisasi URL session:', err);
    return generateSecureToken(11);
  }
}
