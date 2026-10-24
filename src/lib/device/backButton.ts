import { App } from '@capacitor/app';

export type BackHandler = () => boolean;

interface RegisteredHandler {
  id: number;
  priority: number;
  handler: BackHandler;
}

const handlers: RegisteredHandler[] = [];
let nextId = 1;
let isListenerAttached = false;

function triggerBackAction(): void {
  // Urutkan dari prioritas tertinggi ke terendah
  const sorted = [...handlers].sort((a, b) => b.priority - a.priority);
  for (const item of sorted) {
    const consumed = item.handler();
    if (consumed) {
      return;
    }
  }
}

/**
 * Daftarkan handler untuk tombol back default / hardware Android.
 * Mengembalikan fungsi unsubscribe.
 * Handler harus mengembalikan `true` jika event telah dikonsumsi (misal dialog ditutup).
 */
export function registerBackHandler(handler: BackHandler, priority = 10): () => void {
  const id = nextId++;
  handlers.push({ id, priority, handler });

  if (!isListenerAttached && typeof window !== 'undefined') {
    isListenerAttached = true;
    try {
      App.addListener('backButton', () => {
        triggerBackAction();
      });
    } catch {
      // Abaikan jika tidak di lingkungan Capacitor native
    }

    // Tangani juga gestur back browser / tombol escape jika relevan
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        triggerBackAction();
      }
    });

    window.addEventListener('popstate', () => {
      triggerBackAction();
    });
  }

  return () => {
    const idx = handlers.findIndex((h) => h.id === id);
    if (idx !== -1) {
      handlers.splice(idx, 1);
    }
  };
}
