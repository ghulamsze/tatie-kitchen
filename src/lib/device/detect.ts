export type Platform = 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'unknown';
export type FormFactor = 'phone' | 'tablet' | 'laptop';
export type SignalSource = 'override' | 'capacitor' | 'client-hints' | 'user-agent';

export interface DeviceInfo {
  platform: Platform;
  formFactor: FormFactor;
  source: SignalSource;
  native: boolean;
}

export interface DeviceEnv {
  urlSearch?: string;
  storedOverride?: string | null;
  userAgent?: string;
  maxTouchPoints?: number;
  screenWidth?: number;
  screenHeight?: number;
  userAgentData?: {
    platform?: string;
    mobile?: boolean;
  };
  capacitor?: {
    isNative?: boolean;
    platform?: string;
  };
}

export const DEVICE_OVERRIDE_KEY = 'tk-device';

/**
 * Fungsi murni untuk mengklasifikasikan perangkat berdasarkan hierarki sinyal
 * yang didefinisikan dalam docs/arsitektur.md bagian 3.
 */
export function classifyDevice(env: DeviceEnv): DeviceInfo {
  const ua = env.userAgent || '';
  const touchPoints = env.maxTouchPoints || 0;
  const shortestSide = Math.min(env.screenWidth || 0, env.screenHeight || 0);

  // 1. Sinyal 1: Override (?device=tablet|laptop|phone, atau localStorage)
  let overrideVal: FormFactor | null = null;
  let isAutoReset = false;

  if (env.urlSearch) {
    const params = new URLSearchParams(env.urlSearch);
    const paramDevice = params.get('device');
    if (paramDevice === 'auto') {
      isAutoReset = true;
      overrideVal = null;
    } else if (paramDevice === 'tablet' || paramDevice === 'laptop' || paramDevice === 'phone') {
      overrideVal = paramDevice;
    }
  }

  if (!isAutoReset && !overrideVal && env.storedOverride) {
    if (env.storedOverride === 'tablet' || env.storedOverride === 'laptop' || env.storedOverride === 'phone') {
      overrideVal = env.storedOverride;
    }
  }

  // Tentukan platform dasar dari userAgent/Capacitor/Hints
  let basePlatform: Platform = 'unknown';
  const isCapacitorNative = Boolean(env.capacitor?.isNative);

  if (env.capacitor?.platform === 'android') {
    basePlatform = 'android';
  } else if (env.capacitor?.platform === 'ios') {
    basePlatform = 'ios';
  } else if (/iPhone|iPod/i.test(ua)) {
    basePlatform = 'ios';
  } else if (/iPad/i.test(ua)) {
    basePlatform = 'ios';
  } else if (/Macintosh/i.test(ua) && touchPoints > 1) {
    basePlatform = 'ios'; // iPadOS yang mengaku Mac
  } else if (/Android/i.test(ua)) {
    basePlatform = 'android';
  } else if (/Windows/i.test(ua)) {
    basePlatform = 'windows';
  } else if (/Macintosh/i.test(ua)) {
    basePlatform = 'mac';
  } else if (/Linux|X11|CrOS/i.test(ua)) {
    basePlatform = 'linux';
  } else if (env.userAgentData?.platform) {
    const p = env.userAgentData.platform.toLowerCase();
    if (p.includes('win')) basePlatform = 'windows';
    else if (p.includes('mac')) basePlatform = 'mac';
    else if (p.includes('android')) basePlatform = 'android';
    else if (p.includes('linux')) basePlatform = 'linux';
  }

  // Jika ada override, override MENANG sebagai sinyal tertinggi
  if (overrideVal) {
    return {
      platform: basePlatform,
      formFactor: overrideVal,
      source: 'override',
      native: isCapacitorNative,
    };
  }

  // 2. Sinyal 2: Capacitor Native
  if (isCapacitorNative) {
    const capPlatform = env.capacitor?.platform;
    const platform: Platform = capPlatform === 'android' ? 'android' : capPlatform === 'ios' ? 'ios' : 'unknown';
    // Di Android/iOS native: jika shortestSide >= 600 anggap tablet, jika di bawah itu anggap phone
    const formFactor: FormFactor = shortestSide >= 600 ? 'tablet' : 'phone';
    return {
      platform,
      formFactor,
      source: 'capacitor',
      native: true,
    };
  }

  // 3. Sinyal 3: Client Hints (navigator.userAgentData) jika tidak ada UA detil
  if (env.userAgentData && !ua) {
    const p = (env.userAgentData.platform || '').toLowerCase();
    const isMobile = Boolean(env.userAgentData.mobile);
    let platform: Platform = 'unknown';
    if (p.includes('win')) platform = 'windows';
    else if (p.includes('mac')) platform = 'mac';
    else if (p.includes('android')) platform = 'android';
    else if (p.includes('linux')) platform = 'linux';

    let formFactor: FormFactor = 'laptop';
    if (isMobile) {
      formFactor = shortestSide >= 600 ? 'tablet' : 'phone';
    }

    return {
      platform,
      formFactor,
      source: 'client-hints',
      native: false,
    };
  }

  // 4. Sinyal 4: navigator.userAgent
  if (/iPhone|iPod/i.test(ua)) {
    return { platform: 'ios', formFactor: 'phone', source: 'user-agent', native: false };
  }

  if (/iPad/i.test(ua)) {
    return { platform: 'ios', formFactor: 'tablet', source: 'user-agent', native: false };
  }

  if (/Macintosh/i.test(ua) && touchPoints > 1) {
    // iPadOS modern yang mengaku Macintosh dengan multitouch
    return { platform: 'ios', formFactor: 'tablet', source: 'user-agent', native: false };
  }

  if (/Android/i.test(ua)) {
    // Penajam: jika sisi terpendek >= 600 px anggap tablet, atau tanpa kata 'Mobile'
    const hasMobileWord = /Mobile/i.test(ua);
    let formFactor: FormFactor = hasMobileWord ? 'phone' : 'tablet';
    if (shortestSide >= 600) {
      formFactor = 'tablet';
    }
    return { platform: 'android', formFactor, source: 'user-agent', native: false };
  }

  if (/Windows NT/i.test(ua)) {
    return { platform: 'windows', formFactor: 'laptop', source: 'user-agent', native: false };
  }

  if (/Macintosh/i.test(ua)) {
    return { platform: 'mac', formFactor: 'laptop', source: 'user-agent', native: false };
  }

  if (/Linux|X11|CrOS/i.test(ua)) {
    return { platform: 'linux', formFactor: 'laptop', source: 'user-agent', native: false };
  }

  return {
    platform: basePlatform,
    formFactor: 'laptop',
    source: 'user-agent',
    native: false,
  };
}

/**
 * Mendapatkan informasi perangkat saat ini dari runtime browser.
 * CATATAN SKILL: Deteksi hanya boleh lewat fungsi ini.
 */
export function getCurrentDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      platform: 'unknown',
      formFactor: 'laptop',
      source: 'user-agent',
      native: false,
    };
  }

  let storedOverride: string | null = null;
  try {
    storedOverride = localStorage.getItem(DEVICE_OVERRIDE_KEY);
  } catch {
    // ignore
  }

  // Cek parameter URL untuk update localStorage
  const search = window.location.search;
  if (search) {
    const params = new URLSearchParams(search);
    const paramDevice = params.get('device');
    if (paramDevice === 'auto') {
      try {
        localStorage.removeItem(DEVICE_OVERRIDE_KEY);
      } catch {
        // ignore
      }
      storedOverride = null;
    } else if (paramDevice === 'tablet' || paramDevice === 'laptop' || paramDevice === 'phone') {
      try {
        localStorage.setItem(DEVICE_OVERRIDE_KEY, paramDevice);
      } catch {
        // ignore
      }
      storedOverride = paramDevice;
    }
  }

  // Gunakan screen.width & screen.height fisik agar tidak mengecil saat virtual keyboard muncul di tablet/browser
  const physWidth = typeof window !== 'undefined' && window.screen ? window.screen.width : window.innerWidth;
  const physHeight = typeof window !== 'undefined' && window.screen ? window.screen.height : window.innerHeight;
  const screenW = Math.max(physWidth, window.innerWidth);
  const screenH = Math.max(physHeight, window.innerHeight);

  const env: DeviceEnv = {
    urlSearch: search,
    storedOverride,
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    screenWidth: screenW,
    screenHeight: screenH,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userAgentData: (navigator as any).userAgentData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    capacitor: (window as any).Capacitor
      ? {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          isNative: (window as any).Capacitor.isNativePlatform?.(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          platform: (window as any).Capacitor.getPlatform?.(),
        }
      : undefined,
  };

  return classifyDevice(env);
}

/**
 * Mengubah override perangkat dan reload atau update
 */
export function setDeviceOverride(override: FormFactor | 'auto'): void {
  if (typeof window === 'undefined') return;
  try {
    if (override === 'auto') {
      localStorage.removeItem(DEVICE_OVERRIDE_KEY);
    } else {
      localStorage.setItem(DEVICE_OVERRIDE_KEY, override);
    }
  } catch {
    // ignore
  }

  // Update query string
  const url = new URL(window.location.href);
  url.searchParams.set('device', override);
  window.location.href = url.toString();
}
