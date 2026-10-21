import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Button,
  Chip,
  Panel,
  Sheet,
  Dialog,
  Toast,
  InputField,
  OptionRow,
  NavbarPill,
  NoInternetNotice,
} from './index.ts';

describe('Komponen Dasar UI Tati’e Kitchen', () => {
  it('Button lime harus memiliki kelas tk-btn-lime dan dapat diklik', () => {
    const handleClick = vi.fn();
    render(<Button variant="lime" onClick={handleClick}>Lanjut</Button>);
    const btn = screen.getByRole('button', { name: 'Lanjut' });
    expect(btn.classList.contains('tk-btn-lime')).toBe(true);
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('Chip harus memiliki role button dan status aria-pressed saat aktif', () => {
    render(<Chip active={true}>Makanan</Chip>);
    const chip = screen.getByRole('button', { name: 'Makanan' });
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(chip.classList.contains('active')).toBe(true);
  });

  it('Panel harus merender konten dengan benar', () => {
    render(<Panel highlight>Konten Penting</Panel>);
    expect(screen.getByText('Konten Penting')).toBeInTheDocument();
  });

  it('Sheet harus muncul hanya saat isOpen true', () => {
    const { rerender } = render(<Sheet isOpen={false} title="Sheet Test">Isi</Sheet>);
    expect(screen.queryByText('Sheet Test')).not.toBeInTheDocument();

    rerender(<Sheet isOpen={true} title="Sheet Test">Isi</Sheet>);
    expect(screen.getByText('Sheet Test')).toBeInTheDocument();
  });

  it('Dialog harus memiliki role dialog dan aria-modal', () => {
    render(<Dialog isOpen={true} title="Konfirmasi Hapus" description="Yakin?"><div>Body</div></Dialog>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('Toast harus menampilkan pesan status', () => {
    render(<Toast message="Berhasil disimpan" visible={true} />);
    expect(screen.getByText('Berhasil disimpan')).toBeInTheDocument();
  });

  it('InputField harus menerima teks input', () => {
    render(<InputField placeholder="Nama menu" />);
    const input = screen.getByPlaceholderText('Nama menu') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Kopi Susu' } });
    expect(input.value).toBe('Kopi Susu');
  });

  it('OptionRow harus menampilkan tanda centang saat aktif', () => {
    render(<OptionRow label="Hari ini" active={true} />);
    const option = screen.getByRole('button', { name: /Hari ini/ });
    expect(option.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('NavbarPill harus menandai item aktif dengan aria-current page', () => {
    const handleSelect = vi.fn();
    render(<NavbarPill activeItem="Home" onSelect={handleSelect} />);
    const homeBtn = screen.getByRole('button', { name: 'Home' });
    expect(homeBtn.getAttribute('aria-current')).toBe('page');

    const riwayatBtn = screen.getByRole('button', { name: 'Riwayat' });
    fireEvent.click(riwayatBtn);
    expect(handleSelect).toHaveBeenCalledWith('Riwayat');
  });

  it('NoInternetNotice varian banner harus menampilkan teks offline', () => {
    render(<NoInternetNotice variant="banner" />);
    expect(screen.getByText(/Koneksi terputus/)).toBeInTheDocument();
  });

  it('NoInternetNotice varian dialog harus merender modal konfirmasi', () => {
    render(<NoInternetNotice variant="dialog" onRetry={() => {}} />);
    expect(screen.getByText('Koneksi Internet Terputus')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });
});
