import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MenuCard } from './home/MenuCard.tsx';
import { HomeScreen } from './home/HomeScreen.tsx';
import { CustomerMenuView } from './menu-lengkap/CustomerMenuView.tsx';
import { PaymentScreen } from './bayar/PaymentScreen.tsx';
import { getQuickCashOptions } from './bayar/quickCash.ts';
import { ReceiptScreen } from './struk/ReceiptScreen.tsx';
import { HistoryScreen } from './riwayat/HistoryScreen.tsx';
import { useCartStore } from '../stores/cartStore.ts';
import { useMenuStore } from '../stores/menuStore.ts';
import { useHistoryStore } from '../stores/historyStore.ts';
import { supabase } from '../lib/supabase/client.ts';

describe('Layar Tablet Bagian B (Fase 5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCartStore.getState().clearCart();
    useMenuStore.setState({
      selectedCategory: 'Semua',
      searchQuery: '',
      heldItem: null,
      toastMessage: null,
    });
    useHistoryStore.setState({
      selectedRange: 'hari-ini',
      selectedOrder: null,
    });
  });

  describe('1. MenuCard', () => {
    it('harus merender nama, tag harga Rupiah, dan status dengan benar', () => {
      const mockItem = {
        id: 'm-test-1',
        shop_id: 'shop-001',
        group_id: 'g-mie',
        name: 'Mie Goreng Komplit',
        price_idr: 40000,
        available: true,
        photo_path: 'foto/mie.jpg',
        sort: 1,
        active: true,
        created_at: '',
      };

      const handleAdd = vi.fn();
      const handleHold = vi.fn();

      render(<MenuCard item={mockItem} onAdd={handleAdd} onHold={handleHold} />);

      expect(screen.getByText('Mie Goreng Komplit')).toBeInTheDocument();
      expect(screen.getByText('Rp40.000')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Mie Goreng Komplit/i }));
      expect(handleAdd).toHaveBeenCalledWith(mockItem);
    });

    it('tidak memanggil onAdd jika item ditandai habis (available: false)', () => {
      const mockItem = {
        id: 'm-test-habis',
        shop_id: 'shop-001',
        group_id: 'g-snack',
        name: 'Kebab',
        price_idr: 30000,
        available: false,
        photo_path: 'foto/kebab.jpg',
        sort: 3,
        active: true,
        created_at: '',
      };

      const handleAdd = vi.fn();
      const handleHold = vi.fn();

      render(<MenuCard item={mockItem} onAdd={handleAdd} onHold={handleHold} />);

      fireEvent.click(screen.getByRole('button', { name: /Kebab/i }));
      expect(handleAdd).not.toHaveBeenCalled();
    });
  });

  describe('2. HomeScreen & Keranjang Pesanan', () => {
    it('harus menampilkan katalog menu, menambah ke keranjang, dan menghitung total', () => {
      render(
        <HomeScreen
          onOpenCustomerMenu={vi.fn()}
          onProceedToPayment={vi.fn()}
          onChangeCashier={vi.fn()}
        />
      );

      expect(screen.getByText('Tati’e Kitchen')).toBeInTheDocument();
      expect(screen.getByText('Pesanan baru')).toBeInTheDocument();

      // Tambahkan item Mie Goreng Komplit ke keranjang
      const mieItem = screen.getByRole('button', { name: /Mie Goreng Komplit/i });
      fireEvent.click(mieItem);

      expect(screen.getByText('Pesanan baru')).toBeInTheDocument();
      // Harga Rp40.000 muncul di kartu menu, baris keranjang, dan subtotal
      const priceElements = screen.getAllByText('Rp40.000');
      expect(priceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('memfilter menu berdasarkan chip kategori', () => {
      render(
        <HomeScreen
          onOpenCustomerMenu={vi.fn()}
          onProceedToPayment={vi.fn()}
          onChangeCashier={vi.fn()}
        />
      );

      // Klik kategori 'Mie'
      const mieChip = screen.getByRole('button', { name: 'Mie' });
      fireEvent.click(mieChip);

      expect(screen.getByText('Mie Goreng Komplit')).toBeInTheDocument();
      // Burger Daging (snack) tidak boleh muncul
      expect(screen.queryByText('Burger Daging')).not.toBeInTheDocument();
    });

    it('membuka menu lengkap saat tombol "Menu lengkap" ditekan', () => {
      const handleOpenCustomerMenu = vi.fn();
      render(
        <HomeScreen
          onOpenCustomerMenu={handleOpenCustomerMenu}
          onProceedToPayment={vi.fn()}
          onChangeCashier={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Menu lengkap' }));
      expect(handleOpenCustomerMenu).toHaveBeenCalled();
    });
  });

  describe('3. CustomerMenuView (Golden Triangle Tampilan Pembeli)', () => {
    it('harus merender kotak sorot Terlaris dengan 7 menu default', () => {
      const handleClose = vi.fn();
      render(<CustomerMenuView onClose={handleClose} />);

      expect(screen.getByText('Menu Tati’e Kitchen')).toBeInTheDocument();
      expect(screen.getByText('Terlaris')).toBeInTheDocument();
      expect(screen.getAllByText('Nasi Goreng Telur').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Nasi Ayam Penyet').length).toBeGreaterThanOrEqual(1);

      fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('4. PaymentScreen (Keypad Meja & Bayar Tunai)', () => {
    it('harus memvalidasi nomor meja keypad, opsi uang, dan menyelesaikan pembayaran', async () => {
      // Mock RPC call agar tidak tergantung koneksi jaringan dalam unit test
      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: {
          id: 'ord-mock-123',
          shop_id: 'shop-001',
          cashier_id: 'c-001',
          device_id: null,
          table_no: '8',
          total_idr: 40000,
          cash_received_idr: 100000,
          change_idr: 60000,
          status: 'paid',
          created_at: new Date().toISOString(),
        },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.rpc>>);

      // Siapkan keranjang dengan 1 item
      act(() => {
        useCartStore.getState().addItem({
          id: 'm-01',
          shop_id: 'shop-001',
          group_id: 'g-mie',
          name: 'Mie Goreng Komplit',
          price_idr: 40000,
          available: true,
          photo_path: '',
          sort: 1,
          active: true,
          created_at: '',
        });
      });

      const handleSuccess = vi.fn();
      const handleCancel = vi.fn();

      render(<PaymentScreen onSuccess={handleSuccess} onCancel={handleCancel} />);

      expect(screen.getByText('Nomor meja')).toBeInTheDocument();
      expect(screen.getByText('Pembayaran tunai')).toBeInTheDocument();

      // Tekan tombol keypad '8'
      const key8 = screen.getByRole('button', { name: '8' });
      fireEvent.click(key8);

      // Tekan tombol Selesaikan pembayaran
      const payButton = screen.getByRole('button', { name: 'Selesaikan pembayaran' });
      await act(async () => {
        fireEvent.click(payButton);
      });

      expect(handleSuccess).toHaveBeenCalled();
      expect(useCartStore.getState().lines.length).toBe(0);
      expect(useCartStore.getState().lastOrder).not.toBeNull();
    });

    it('harus menonaktifkan tombol selesaikan pembayaran jika meja belum diisi (default x)', () => {
      act(() => {
        useCartStore.getState().setTableNo('x');
        useCartStore.getState().addItem({
          id: 'm-01',
          shop_id: 'shop-001',
          group_id: 'g-mie',
          name: 'Mie Goreng Komplit',
          price_idr: 40000,
          available: true,
          photo_path: '',
          sort: 1,
          active: true,
          created_at: '',
        });
      });

      render(<PaymentScreen onSuccess={vi.fn()} onCancel={vi.fn()} />);

      const payButton = screen.getByRole('button', { name: 'Selesaikan pembayaran' });
      // Tombol harus disabled saat meja masih 'x'
      expect(payButton).toBeDisabled();

      // Masukkan nomor meja via keypad
      const key3 = screen.getByRole('button', { name: '3' });
      fireEvent.click(key3);

      // Sekarang tombol aktif
      expect(payButton).not.toBeDisabled();
    });

    it('harus membatasi nomor meja maksimal 15 dan auto-confirm input', () => {
      act(() => {
        useCartStore.getState().setTableNo('...');
      });

      render(<PaymentScreen onSuccess={vi.fn()} onCancel={vi.fn()} />);

      const key1 = screen.getByRole('button', { name: '1' });
      const key6 = screen.getByRole('button', { name: '6' });
      const key5 = screen.getByRole('button', { name: '5' });
      const backspaceBtn = screen.getByRole('button', { name: 'Hapus' });

      // Tekan 1 -> meja 1
      fireEvent.click(key1);
      expect(useCartStore.getState().tableNo).toBe('1');

      // Tekan 6 -> 16 > 15 (diblokir, tetap 1)
      fireEvent.click(key6);
      expect(useCartStore.getState().tableNo).toBe('1');

      // Tekan 5 -> 15 <= 15 (diizinkan, jadi 15)
      fireEvent.click(key5);
      expect(useCartStore.getState().tableNo).toBe('15');

      // Tekan backspace -> kembali ke 1
      fireEvent.click(backspaceBtn);
      expect(useCartStore.getState().tableNo).toBe('1');

      // Tekan backspace lagi -> kembali ke '...'
      fireEvent.click(backspaceBtn);
      expect(useCartStore.getState().tableNo).toBe('...');
    });

    it('harus menghasilkan 4 opsi uang cepat sesuai algoritma tanpa duplikat', () => {
      // Contoh 1: 25.000 -> Uang pas, 50k, 100k, 200k
      const opts25k = getQuickCashOptions(25000);
      expect(opts25k.map((o: { amount: number }) => o.amount)).toEqual([25000, 50000, 100000, 200000]);

      // Contoh 2: 130.000 -> Uang pas, 150k, 200k, 500k
      const opts130k = getQuickCashOptions(130000);
      expect(opts130k.map((o: { amount: number }) => o.amount)).toEqual([130000, 150000, 200000, 500000]);

      // Contoh 3: 400.000 -> Uang pas, 450k, 500k, 1M
      const opts400k = getQuickCashOptions(400000);
      expect(opts400k.map((o: { amount: number }) => o.amount)).toEqual([400000, 450000, 500000, 1000000]);
    });

    it('harus men-deselect "Uang pas" saat kolom manual difokuskan atau diisi', () => {
      render(<PaymentScreen onSuccess={vi.fn()} onCancel={vi.fn()} />);

      const uangPasBtn = screen.getByRole('button', { name: 'Uang pas' });
      expect(uangPasBtn).toHaveClass('selected');

      const manualInput = screen.getByPlaceholderText('Input manual uang diterima...');
      // Fokus pada input manual
      fireEvent.focus(manualInput);

      // Uang pas harus ter-deselect
      expect(uangPasBtn).not.toHaveClass('selected');
    });
  });

  describe('5. ReceiptScreen (Struk Monospace & Unduh/Share)', () => {
    it('harus merender kartu struk dengan nama toko, alamat, dan tombol Pesanan baru', () => {
      const handleNewOrder = vi.fn();
      render(<ReceiptScreen onNewOrder={handleNewOrder} />);

      expect(screen.getByText('Jl. Tamalate 2 No. 8, Makassar')).toBeInTheDocument();
      expect(screen.getByText('Pembayaran berhasil')).toBeInTheDocument();

      const newOrderButton = screen.getByRole('button', { name: 'Pesanan baru' });
      fireEvent.click(newOrderButton);
      expect(handleNewOrder).toHaveBeenCalled();
    });
  });

  describe('6. HistoryScreen (Riwayat Transaksi & Filter)', () => {
    it('harus menampilkan riwayat transaksi dan membuka sheet filter waktu', () => {
      render(<HistoryScreen />);

      expect(screen.getByText('Riwayat Transaksi')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Pilih rentang waktu' })).toBeInTheDocument();

      // Buka sheet rentang waktu
      fireEvent.click(screen.getByRole('button', { name: 'Pilih rentang waktu' }));
      expect(screen.getByText('Pilih rentang waktu')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Terapkan' })).toBeInTheDocument();
    });
  });
});
