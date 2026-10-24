import { create } from 'zustand';

export type LaptopTab = 'Home' | 'Riwayat' | 'Menu' | 'Kasir' | 'Laporan' | 'Pengaturan' | 'Akun';

export interface LaptopUser {
  email: string;
  name: string;
  role: string;
}

export interface LaptopAuthState {
  isAuthenticated: boolean;
  user: LaptopUser | null;
  activeTab: LaptopTab;
  isProfileMenuOpen: boolean;
  selectedRange: string;
  isLoginLoading: boolean;
  loginError: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  setActiveTab: (tab: LaptopTab) => void;
  setSelectedRange: (range: string) => void;
  toggleProfileMenu: (open?: boolean) => void;
}

const STORAGE_KEY = 'tk_laptop_auth';

const getInitialAuth = (): { isAuthenticated: boolean; user: LaptopUser | null } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isAuthenticated) {
        return { isAuthenticated: true, user: parsed.user || { email: 'example@gmail.com', name: 'Pemilik', role: 'owner' } };
      }
    }
  } catch {
    // ignore
  }
  return { isAuthenticated: false, user: null };
};

const initialAuth = getInitialAuth();

export const useLaptopAuthStore = create<LaptopAuthState>((set) => ({
  isAuthenticated: initialAuth.isAuthenticated,
  user: initialAuth.user,
  activeTab: 'Home',
  isProfileMenuOpen: false,
  selectedRange: 'Hari ini · 21 Okt 2026',
  isLoginLoading: false,
  loginError: null,

  login: async (email: string, password: string) => {
    set({ isLoginLoading: true, loginError: null });

    if (!password || password.trim() === '') {
      set({ isLoginLoading: false, loginError: 'Kata sandi tidak boleh kosong.' });
      return false;
    }

    if (password.length < 4) {
      set({ isLoginLoading: false, loginError: 'Kata sandi tidak cocok. Coba lagi.' });
      return false;
    }

    const user: LaptopUser = {
      email: email.trim() || 'example@gmail.com',
      name: 'Pemilik',
      role: 'owner',
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isAuthenticated: true, user }));
    } catch {
      // ignore
    }

    set({
      isAuthenticated: true,
      user,
      isLoginLoading: false,
      loginError: null,
    });
    return true;
  },

  loginWithGoogle: async () => {
    set({ isLoginLoading: true, loginError: null });
    const user: LaptopUser = {
      email: 'example@gmail.com',
      name: 'Pemilik',
      role: 'owner',
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isAuthenticated: true, user }));
    } catch {
      // ignore
    }

    set({
      isAuthenticated: true,
      user,
      isLoginLoading: false,
      loginError: null,
    });
    return true;
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({
      isAuthenticated: false,
      user: null,
      isProfileMenuOpen: false,
      loginError: null,
    });
  },

  setActiveTab: (tab: LaptopTab) => {
    set({ activeTab: tab, isProfileMenuOpen: false });
  },

  setSelectedRange: (range: string) => {
    set({ selectedRange: range });
  },

  toggleProfileMenu: (open?: boolean) => {
    set((state) => ({
      isProfileMenuOpen: open !== undefined ? open : !state.isProfileMenuOpen,
    }));
  },
}));
