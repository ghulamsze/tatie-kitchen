import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PhoneHomeScreen } from './screens/PhoneHomeScreen.tsx';
import { useHistoryStore } from '../../stores/historyStore.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { getShopTodayDateStr } from '../../lib/format/formatters.ts';

describe('PhoneHomeScreen & useLiveOrders (Fase 2)', () => {
  const todayStr = getShopTodayDateStr();

  beforeEach(() => {
    useCashierStore.setState({
      cashiers: [
        { id: 'c1', name: 'Robertus Amaresi', active: true, shop_id: 's1', created_at: '' },
        { id: 'c2', name: 'Puspitawati', active: true, shop_id: 's1', created_at: '' },
      ],
    });
    useHistoryStore.setState({ orders: [] });
  });

  it('harus menampilkan omzet Rp0 dan pesan kosong jika belum ada transaksi hari ini', () => {
    render(<PhoneHomeScreen />);

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('Total transaksi hari ini')).toBeInTheDocument();
    expect(screen.getByText('Rp0')).toBeInTheDocument();
    expect(screen.getByText('0 transaksi')).toBeInTheDocument();
    expect(screen.getByText('Belum ada transaksi hari ini')).toBeInTheDocument();
  });

  it('harus menghitung total omzet hari ini dan menampilkan daftar transaksi terbaru secara akurat', () => {
    useHistoryStore.setState({
      orders: [
        {
          order: {
            id: 'ord-1',
            shop_id: 's1',
            cashier_id: 'c1',
            device_id: null,
            table_no: '4',
            total_idr: 80000,
            cash_received_idr: 100000,
            change_idr: 20000,
            status: 'paid',
            created_at: `${todayStr}T10:01:00.000Z`,
          },
          items: [
            {
              id: 'it-1',
              order_id: 'ord-1',
              menu_item_id: 'm1',
              name_snapshot: 'Mie Goreng Komplit',
              price_snapshot_idr: 40000,
              qty: 2,
            },
          ],
        },
        {
          order: {
            id: 'ord-2',
            shop_id: 's1',
            cashier_id: 'c2',
            device_id: null,
            table_no: '2',
            total_idr: 45000,
            cash_received_idr: 50000,
            change_idr: 5000,
            status: 'paid',
            created_at: `${todayStr}T11:30:00.000Z`,
          },
          items: [
            {
              id: 'it-2',
              order_id: 'ord-2',
              menu_item_id: 'm2',
              name_snapshot: 'Nasi Goreng Telur',
              price_snapshot_idr: 25000,
              qty: 1,
            },
            {
              id: 'it-3',
              order_id: 'ord-2',
              menu_item_id: 'm3',
              name_snapshot: 'Burger Daging',
              price_snapshot_idr: 20000,
              qty: 1,
            },
          ],
        },
      ],
    });

    render(<PhoneHomeScreen />);

    expect(screen.getByText('Rp125.000')).toBeInTheDocument();
    expect(screen.getByText('2 transaksi')).toBeInTheDocument();

    expect(screen.getByText('Meja 4')).toBeInTheDocument();
    expect(screen.getByText('Rp80.000')).toBeInTheDocument();
    expect(screen.getByText('Meja 2')).toBeInTheDocument();
    expect(screen.getByText('Rp45.000')).toBeInTheDocument();
  });

  it('harus memanggil onNavigateToHistory saat tombol "Lihat semua ›" diketuk', () => {
    const handleNavigate = vi.fn();
    render(<PhoneHomeScreen onNavigateToHistory={handleNavigate} />);

    const seeAllBtn = screen.getByRole('button', { name: 'Lihat semua ›' });
    fireEvent.click(seeAllBtn);
    expect(handleNavigate).toHaveBeenCalledTimes(1);
  });

  it('harus reaktif memperbarui total omzet saat order baru masuk tanpa perlu muat ulang halaman', async () => {
    const { rerender } = render(<PhoneHomeScreen />);
    expect(screen.getByText('Rp0')).toBeInTheDocument();

    act(() => {
      useHistoryStore.getState().addOrder(
        {
          id: 'ord-new',
          shop_id: 's1',
          cashier_id: 'c1',
          device_id: null,
          table_no: '8',
          total_idr: 50000,
          cash_received_idr: 50000,
          change_idr: 0,
          status: 'paid',
          created_at: `${todayStr}T12:00:00.000Z`,
        },
        [
          {
            id: 'it-new',
            order_id: 'ord-new',
            menu_item_id: 'm1',
            name_snapshot: 'Mie Goreng Komplit',
            price_snapshot_idr: 50000,
            qty: 1,
          },
        ]
      );
    });

    rerender(<PhoneHomeScreen />);
    const matches = await screen.findAllByText('Rp50.000');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1 transaksi')).toBeInTheDocument();
    expect(screen.getByText('Meja 8')).toBeInTheDocument();
  });
});
