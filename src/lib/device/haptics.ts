import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Utilitas Haptic Feedback Lintas Platform (iOS Apple Taptic Engine + Android + Web)
 * Menggunakan @capacitor/haptics untuk sensasi getaran native iOS/Android
 * dan fallback ke Web Vibration API jika dijalankan di browser.
 */

// Helper aman mendeteksi apakah Web Vibration API tersedia
const hasWebVibrate = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';
};

/**
 * Haptic getaran umum dengan fallback ke pola getar web
 */
export async function triggerHapticFeedback(pattern: number | number[] = [40, 60, 40]): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Fallback Web Vibration
    if (hasWebVibrate()) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Haptic khusus gestur swipe tab layar di iOS (Ringan, tajam, presisi)
 */
export async function triggerHapticSwipe(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    if (hasWebVibrate()) {
      try {
        navigator.vibrate(25);
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Haptic saat aksi hapus item/menu/profil/foto (Peringatan tegas)
 */
export async function triggerHapticDelete(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    if (hasWebVibrate()) {
      try {
        navigator.vibrate([40, 50, 40]);
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Haptic saat aksi 'Urungkan' (Undo) dipicu (Pemberitahuan pemulihan)
 */
export async function triggerHapticUndo(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    if (hasWebVibrate()) {
      try {
        navigator.vibrate([30, 40]);
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Haptic untuk semua animasi goyang/tolak (Shake Reject)
 * - Numpad salah/ditolak
 * - Menahan kasir default (Puspitawati / Robertus) yang dilarang dihapus
 * - Validasi input wajib merah di form menu
 */
export async function triggerHapticReject(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    if (hasWebVibrate()) {
      try {
        navigator.vibrate([50, 60, 50]);
      } catch {
        // ignore
      }
    }
  }
}
