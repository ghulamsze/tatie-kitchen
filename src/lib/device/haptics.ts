/**
 * Utilitas Haptic Feedback (Getaran) Default Perangkat HP / Tablet
 * Menggunakan Web Vibration API standar bawaan browser / WebView Android.
 */

export function triggerHapticFeedback(pattern: number | number[] = [40, 60, 40]): void {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Abaikan dengan aman jika perangkat/browser tidak mendukung navigator.vibrate
  }
}
