import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntroScreen } from './intro/IntroScreen.tsx';
import { SelectCashierScreen } from './profil/SelectCashierScreen.tsx';
import { AddCashierDialog } from './profil/AddCashierDialog.tsx';
import { AccountScreen } from './akun/AccountScreen.tsx';
import { AppearanceSheet } from './akun/AppearanceSheet.tsx';
import { useCashierStore } from '../stores/cashierStore.ts';

describe('Layar Tablet Bagian A (Fase 4)', () => {
  beforeEach(() => {
    useCashierStore.setState({
      cashiers: [
        { id: 'c-1', shop_id: 's-1', name: 'Robertus Amaresi', active: true, created_at: '' },
        { id: 'c-2', shop_id: 's-1', name: 'Puspitawati', active: true, created_at: '' },
      ],
      activeCashier: { id: 'c-1', shop_id: 's-1', name: 'Robertus Amaresi', active: true, created_at: '' },
      shiftStartTime: '08.00',
    });
  });

  describe('IntroScreen', () => {
    it('harus merender wordmark Tati’e Kitchen dan memicu onFinish saat diklik', () => {
      const handleFinish = vi.fn();
      render(<IntroScreen onFinish={handleFinish} />);

      expect(screen.getByLabelText('Intro Tati’e Kitchen, ketuk untuk melanjutkan')).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Intro Tati’e Kitchen, ketuk untuk melanjutkan'));
      expect(handleFinish).toHaveBeenCalledTimes(1);
    });

    it('harus memanggil onFinish secara otomatis via timer', () => {
      vi.useFakeTimers();
      const handleFinish = vi.fn();
      render(<IntroScreen onFinish={handleFinish} />);

      expect(handleFinish).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1300);
      expect(handleFinish).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe('SelectCashierScreen & AddCashierDialog', () => {
    it('harus menampilkan nama kasir awal dan tombol tambah kasir', () => {
      const handleSelect = vi.fn();
      render(<SelectCashierScreen onSelectCashier={handleSelect} />);

      expect(screen.getByText('Siapa yang bertugas?')).toBeInTheDocument();
      expect(screen.getByText('Robertus Amaresi')).toBeInTheDocument();
      expect(screen.getByText('Puspitawati')).toBeInTheDocument();
      expect(screen.getByText('Tambah kasir')).toBeInTheDocument();
    });

    it('harus memilih kasir saat kartu kasir diklik', () => {
      const handleSelect = vi.fn();
      render(<SelectCashierScreen onSelectCashier={handleSelect} />);

      const cashierBtn = screen.getByRole('button', { name: /Pilih kasir Puspitawati/i });
      fireEvent.click(cashierBtn);
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Puspitawati' })
      );
    });

    it('AddCashierDialog harus memvalidasi nama kasir dan memanggil onAdd', async () => {
      const handleAdd = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();
      render(<AddCashierDialog isOpen={true} onClose={handleClose} onAdd={handleAdd} />);

      const input = screen.getByPlaceholderText('Nama kasir');
      fireEvent.change(input, { target: { value: 'Budi Santoso' } });

      const submitBtn = screen.getByRole('button', { name: 'Tambah' });
      fireEvent.click(submitBtn);

      expect(handleAdd).toHaveBeenCalledWith('Budi Santoso');
    });
  });

  describe('AccountScreen & AppearanceSheet', () => {
    it('harus menampilkan nama kasir aktif dan inisialnya', () => {
      const handleChange = vi.fn();
      render(<AccountScreen onChangeCashier={handleChange} />);

      expect(screen.getByText('Robertus Amaresi')).toBeInTheDocument();
      expect(screen.getByText('RA')).toBeInTheDocument();
      expect(screen.getByText(/Bertugas sejak/)).toBeInTheDocument();

      const changeBtn = screen.getByRole('button', { name: 'Ganti kasir' });
      fireEvent.click(changeBtn);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('AppearanceSheet harus memungkinkan pergantian mode dan palet', () => {
      const handleClose = vi.fn();
      render(<AppearanceSheet isOpen={true} onClose={handleClose} />);

      expect(screen.getByText('Tampilan')).toBeInTheDocument();
      const lightBtn = screen.getByRole('button', { name: /Terang/ });
      fireEvent.click(lightBtn);
      expect(document.documentElement.dataset.theme).toBe('light');

      const closeBtn = screen.getByRole('button', { name: 'Selesai' });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
