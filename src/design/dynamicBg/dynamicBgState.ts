/**
 * Dynamic Background Mode (Beta)
 * Google Stitch Motion Style ambient mesh / aurora background.
 * Self-contained module with toggle state and persistence.
 */

export const BETA_DYNAMIC_BG = true;

export type BgMotionMode = 'static' | 'dynamic';

const BG_MOTION_STORAGE_KEY = 'tk-bg-motion';
const BG_MOTION_EVENT = 'tk:bg-motion-change';

export function getStoredBgMotion(): BgMotionMode {
  if (typeof window === 'undefined') return 'static';
  try {
    const val = localStorage.getItem(BG_MOTION_STORAGE_KEY);
    if (val === 'dynamic' || val === 'static') return val;
  } catch {
    // fallback
  }
  return 'static';
}

export function setStoredBgMotion(mode: BgMotionMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BG_MOTION_STORAGE_KEY, mode);
  } catch {
    // fallback
  }
  applyBgMotion(mode);
  window.dispatchEvent(new CustomEvent(BG_MOTION_EVENT, { detail: mode }));
}

export function applyBgMotion(mode: BgMotionMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.bgMotion = mode;
}

export function subscribeBgMotion(callback: (mode: BgMotionMode) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<BgMotionMode>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getStoredBgMotion());
    }
  };
  window.addEventListener(BG_MOTION_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(BG_MOTION_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
