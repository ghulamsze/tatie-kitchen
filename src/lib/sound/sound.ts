let lastPlayedAt = 0;

/**
 * Memutar suara utama transaksi pembayaran (/assets/audio/payment_check.mp3)
 * Dilengkapi proteksi debounce untuk mencegah overlap jika dipanggil berdekatan.
 */
export function playPaymentSound(): void {
  const now = Date.now();
  if (now - lastPlayedAt < 1200) {
    return;
  }
  lastPlayedAt = now;

  try {
    // Jangan jalankan play di lingkungan jsdom / test runner
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
      return;
    }

    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      const audio = new Audio('/assets/audio/payment_check.mp3');
      if (typeof audio.play === 'function') {
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            // Abaikan error jika autoplay dibatasi oleh browser
          });
        }
      }
    }
  } catch {
    // Abaikan jika audio tidak didukung di lingkungan uji
  }
}
