export type ThemeMode = 'system' | 'light' | 'dark';
export type Palette = 'netflix' | 'mono' | 'hijau' | 'samudra' | 'senja' | 'blush';

export interface PaletteInfo {
  id: Palette;
  name: string;
  darkBg: string;
  accent: string;
}

export const PALETTES: PaletteInfo[] = [
  { id: 'netflix', name: 'Netflix', darkBg: '#171314', accent: '#d92b33' },
  { id: 'mono', name: 'Minimal hitam putih', darkBg: '#0f0f10', accent: '#f5f5f5' },
  { id: 'hijau', name: 'Hijau', darkBg: '#04201f', accent: '#c6f36a' },
  { id: 'samudra', name: 'Samudra', darkBg: '#061a33', accent: '#ffd166' },
  { id: 'senja', name: 'Senja', darkBg: '#2a0f12', accent: '#8af0cf' },
  { id: 'blush', name: 'Blush', darkBg: '#24121a', accent: '#f4a3b7' },
];

const THEME_STORAGE_KEY = 'tk-theme';
const PALETTE_STORAGE_KEY = 'tk-pal';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    if (localStorage.getItem('tk-theme-v2') !== '1') {
      if (localStorage.getItem(THEME_STORAGE_KEY) === 'light') {
        localStorage.setItem(THEME_STORAGE_KEY, 'system');
      }
      localStorage.setItem('tk-theme-v2', '1');
    }
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === 'system' || val === 'light' || val === 'dark') return val;
  } catch {
    // fallback
  }
  return 'system';
}

export function getStoredPalette(): Palette {
  if (typeof window === 'undefined') return 'netflix';
  try {
    const val = localStorage.getItem(PALETTE_STORAGE_KEY) as Palette;
    if (PALETTES.some((p) => p.id === val)) return val;
  } catch {
    // fallback
  }
  return 'netflix';
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const effectiveTheme = mode === 'system' ? getSystemTheme() : mode;
  document.documentElement.dataset.theme = effectiveTheme;
  document.documentElement.style.colorScheme = effectiveTheme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // fallback
  }
}

export function applyPalette(palette: Palette): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.palette = palette;
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  } catch {
    // fallback
  }
}

export function initTheme(): { theme: ThemeMode; palette: Palette } {
  const theme = getStoredTheme();
  const palette = getStoredPalette();
  applyTheme(theme);
  applyPalette(palette);

  if (typeof window !== 'undefined') {
    const darkMql = window.matchMedia('(prefers-color-scheme: dark)');
    const lightMql = window.matchMedia('(prefers-color-scheme: light)');
    const handleMediaChange = () => {
      if (getStoredTheme() === 'system') {
        applyTheme('system');
      }
    };
    darkMql.addEventListener('change', handleMediaChange);
    lightMql.addEventListener('change', handleMediaChange);
  }

  return { theme, palette };
}
