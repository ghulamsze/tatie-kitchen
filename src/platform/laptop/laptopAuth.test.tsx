// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LaptopLoginScreen } from './LaptopLoginScreen.tsx';
import { LaptopSidebar } from './LaptopSidebar.tsx';
import { LaptopTopBar } from './LaptopTopBar.tsx';
import { LaptopRoot } from './LaptopRoot.tsx';
import { useLaptopAuthStore } from './laptopAuthStore.ts';

describe('Platform Laptop - Fase 1: Shell & Autentikasi Pemilik', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    useLaptopAuthStore.setState({
      isAuthenticated: false,
      user: null,
      activeTab: 'Home',
      isProfileMenuOpen: false,
      selectedRange: 'Hari ini',
      isLoginLoading: false,
      loginError: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('1. LaptopLoginScreen (Frame 9a & 10a-10c)', () => {
    it('harus merender judul Tati’e Kitchen, judul Masuk, form email, kata sandi, dan tombol Google', () => {
      const { container } = render(<LaptopLoginScreen />);

      expect(screen.getByText('Tati’e Kitchen')).toBeInTheDocument();
      expect(container.querySelector('.tk-laptop-login-title')?.textContent).toBe('Masuk');
      expect(screen.getByPlaceholderText('example@gmail.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Kata sandi')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    });

    it('harus menampilkan pesan error jika kata sandi kosong atau salah (Frame 10c)', async () => {
      render(<LaptopLoginScreen />);

      const passwordInput = screen.getByPlaceholderText('Kata sandi');
      const submitBtn = screen.getByRole('button', { name: 'Masuk' });

      // Coba submit kata sandi kosong
      await act(async () => {
        fireEvent.click(submitBtn);
      });
      expect(screen.getByText('Kata sandi tidak boleh kosong.')).toBeInTheDocument();

      // Coba submit kata sandi yang salah (< 4 karakter)
      fireEvent.change(passwordInput, { target: { value: '12' } });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('Kata sandi tidak cocok. Coba lagi.')).toBeInTheDocument();
      });
    });

    it('harus berhasil masuk dengan kata sandi yang valid', async () => {
      render(<LaptopLoginScreen />);

      const passwordInput = screen.getByPlaceholderText('Kata sandi');
      const submitBtn = screen.getByRole('button', { name: 'Masuk' });

      fireEvent.change(passwordInput, { target: { value: 'admin123' } });

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(useLaptopAuthStore.getState().isAuthenticated).toBe(true);
        expect(useLaptopAuthStore.getState().user?.email).toBe('example@gmail.com');
      });
    });

    it('harus membuka dialog pilihan akun saat menekan Sign in with Google (Frame 10a)', async () => {
      render(<LaptopLoginScreen />);

      const googleBtn = screen.getByRole('button', { name: /Sign in with Google/i });
      fireEvent.click(googleBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Pilih akun untuk melanjutkan ke Tati’e Kitchen.')).toBeInTheDocument();
      expect(screen.getByLabelText(/Pilih akun Pemilik/i)).toBeInTheDocument();

      // Klik akun Pemilik
      const accountOption = screen.getByLabelText(/Pilih akun Pemilik/i);
      await act(async () => {
        fireEvent.click(accountOption);
      });

      await waitFor(() => {
        expect(useLaptopAuthStore.getState().isAuthenticated).toBe(true);
      });
    });
  });

  describe('2. LaptopSidebar & Navigasi (Frame 9b)', () => {
    it('harus merender 6 menu navigasi utama dan mengaktifkan tab yang diklik', () => {
      useLaptopAuthStore.setState({ isAuthenticated: true });
      render(<LaptopSidebar />);

      const tabs = ['Home', 'Riwayat', 'Menu', 'Kasir', 'Laporan', 'Pengaturan'];
      tabs.forEach((tab) => {
        expect(screen.getByRole('button', { name: tab })).toBeInTheDocument();
      });

      // Tab default adalah Home
      expect(screen.getByRole('button', { name: 'Home' })).toHaveClass('active');

      // Klik tab Riwayat
      fireEvent.click(screen.getByRole('button', { name: 'Riwayat' }));
      expect(useLaptopAuthStore.getState().activeTab).toBe('Riwayat');
    });

    it('harus membuka menu bubble saat kartu profil diklik dan dapat logout', () => {
      useLaptopAuthStore.setState({ isAuthenticated: true });
      render(<LaptopSidebar />);

      const profileCard = screen.getByLabelText('Menu akun pemilik');
      expect(profileCard).toBeInTheDocument();

      // Klik profil untuk memunculkan popover bubble (.bub)
      fireEvent.click(profileCard);
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Akun saya' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Tampilan' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Keluar' })).toBeInTheDocument();

      // Klik Keluar
      fireEvent.click(screen.getByRole('menuitem', { name: 'Keluar' }));
      expect(useLaptopAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('3. LaptopTopBar (Frame 9b & 9c)', () => {
    it('harus menampilkan judul halaman dan tombol dropdown rentang waktu', () => {
      render(<LaptopTopBar title="Home" />);

      expect(screen.getByRole('heading', { level: 2, name: 'Home' })).toBeInTheDocument();
      const rangeBtn = screen.getByLabelText('Pilih rentang waktu');
      expect(rangeBtn).toBeInTheDocument();

      // Klik rentang waktu untuk membuka dropdown preset
      fireEvent.click(rangeBtn);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '7 hari terakhir' })).toBeInTheDocument();

      // Pilih preset 7 hari terakhir
      fireEvent.click(screen.getByRole('button', { name: '7 hari terakhir' }));
      expect(useLaptopAuthStore.getState().selectedRange).toBe('7 hari terakhir');
    });
  });

  describe('4. LaptopRoot Terintegrasi', () => {
    it('harus menampilkan layar login jika belum terautentikasi dan dashboard jika sudah login', () => {
      const { container, rerender } = render(<LaptopRoot />);

      // Awal: belum login -> tampil login form
      expect(container.querySelector('.tk-laptop-login-title')?.textContent).toBe('Masuk');
      expect(screen.queryByText('Selamat datang, Pemilik')).not.toBeInTheDocument();

      // Setelah login
      act(() => {
        useLaptopAuthStore.setState({
          isAuthenticated: true,
          user: { email: 'example@gmail.com', name: 'Pemilik', role: 'owner' },
        });
      });

      rerender(<LaptopRoot />);
      expect(screen.getByText('Selamat datang, Pemilik')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Home' })).toBeInTheDocument();
    });
  });
});
