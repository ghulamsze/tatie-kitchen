import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PhoneHistoryScreen } from './screens/PhoneHistoryScreen.tsx';
import { PhoneDateRangeSheet } from './components/PhoneDateRangeSheet.tsx';
import { useHistoryStore } from '../../stores/historyStore.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { getShopTodayDateStr } from '../../lib/format/formatters.ts';

describe('PhoneHistoryScreen & PhoneDateRangeSheet (Fase 3)', () => {
  const now = new Date();
  const todayStr = getShopTodayDateStr(now);
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = getShopTodayDateStr(yesterdayDate);
  const fiveDaysAgoDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const fiveDaysAgoStr = getShopTodayDateStr(fiveDaysAgoDate);

  beforeEach(() => {
    useCashierStore.setState({
      cashiers: [
        { id: 'c1', name: 'Robertus Amaresi', active: true, shop_id: 's1', created_at: '' },
        { id: 'c2', name: 'Puspitawati', active: true, shop_id: 's1', created_at: '' },
      ],
    });
    useHistoryStore.setState({
      orders: [],
      selectedRange: 'hari-ini',
      selectedOrder: null,
    });
  });

  it('harus menampilkan pesan kosong jika tidak ada transaksi pada rentang terpilih', () => {
    render(<PhoneHistoryScreen />);

    expect(screen.getByRole('heading', { level: 1, name: 'Riwayat' })).toBeInTheDocument();
    expect(
      screen.getByText('Belum ada riwayat transaksi pada rentang ini')
    ).toBeInTheDocument();
  });

  it('harus menampilkan pesanan dikelompokkan berdasarkan tanggal untuk rentang Hari Ini', () => {
    useHistoryStore.setState({
      orders: [
        {
          order: {
            id: 'ord-today-1',
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
              order_id: 'ord-today-1',
              menu_item_id: 'm1',
              name_snapshot: 'Mie Goreng',
              price_snapshot_idr: 40000,
              qty: 2,
            },
          ],
        },
        {
          order: {
            id: 'ord-yesterday-1',
            shop_id: 's1',
            cashier_id: 'c2',
            device_id: null,
            table_no: '2',
            total_idr: 35000,
            cash_received_idr: 50000,
            change_idr: 15000,
            status: 'paid',
            created_at: `${yesterdayStr}T15:30:00.000Z`,
          },
          items: [
            {
              id: 'it-2',
              order_id: 'ord-yesterday-1',
              menu_item_id: 'm2',
              name_snapshot: 'Kebab',
              price_snapshot_idr: 35000,
              qty: 1,
            },
          ],
        },
      ],
    });

    render(<PhoneHistoryScreen />);

    // Hari ini tampil
    expect(screen.getByText('Meja 4')).toBeInTheDocument();
    expect(screen.getByText('Rp80.000')).toBeInTheDocument();
    expect(screen.getByText(/Robertus Amaresi/)).toBeInTheDocument();

    // Kemarin tidak tampil karena default filter adalah 'hari-ini'
    expect(screen.queryByText('Meja 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Rp35.000')).not.toBeInTheDocument();
  });

  it('harus membuka bottom sheet rentang waktu saat pill trigger diklik dan memfilter transaksi kemarin', () => {
    useHistoryStore.setState({
      orders: [
        {
          order: {
            id: 'ord-today-1',
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
          items: [],
        },
        {
          order: {
            id: 'ord-yesterday-1',
            shop_id: 's1',
            cashier_id: 'c2',
            device_id: null,
            table_no: '6',
            total_idr: 74000,
            cash_received_idr: 100000,
            change_idr: 26000,
            status: 'paid',
            created_at: `${yesterdayStr}T21:14:00.000Z`,
          },
          items: [],
        },
      ],
    });

    render(<PhoneHistoryScreen />);

    // Trigger pill rentang waktu
    const trigger = screen.getByLabelText('Pilih rentang waktu');
    fireEvent.click(trigger);

    // Dialog bottom sheet terbuka
    expect(screen.getByText('Rentang waktu')).toBeInTheDocument();
    expect(screen.getByText('Kemarin')).toBeInTheDocument();
    expect(screen.getByText('7 hari terakhir')).toBeInTheDocument();
    expect(screen.getByText('30 hari terakhir')).toBeInTheDocument();

    // Pilih opsi "Kemarin"
    fireEvent.click(screen.getByText('Kemarin'));

    // Klik tombol Terapkan
    fireEvent.click(screen.getByRole('button', { name: 'Terapkan' }));

    // Sekarang hanya transaksi kemarin (Meja 6) yang tampil
    expect(screen.getByText('Meja 6')).toBeInTheDocument();
    expect(screen.getByText('Rp74.000')).toBeInTheDocument();
    expect(screen.queryByText('Meja 4')).not.toBeInTheDocument();
  });

  it('harus memanggil onSelectOrder dan memperbarui selectedOrder di historyStore saat baris diklik', () => {
    const onSelectOrderMock = vi.fn();
    useHistoryStore.setState({
      orders: [
        {
          order: {
            id: 'ord-select-1',
            shop_id: 's1',
            cashier_id: 'c1',
            device_id: null,
            table_no: '8',
            total_idr: 95000,
            cash_received_idr: 100000,
            change_idr: 5000,
            status: 'paid',
            created_at: `${todayStr}T12:00:00.000Z`,
          },
          items: [],
        },
      ],
    });

    render(<PhoneHistoryScreen onSelectOrder={onSelectOrderMock} />);

    const row = screen.getByText('Meja 8').closest('.tk-phone-row');
    expect(row).not.toBeNull();
    if (row) fireEvent.click(row);

    expect(onSelectOrderMock).toHaveBeenCalledWith('ord-select-1');
    expect(useHistoryStore.getState().selectedOrder?.order.id).toBe('ord-select-1');
  });

  it('PhoneDateRangeSheet harus menampilkan input tanggal saat opsi "Pilih tanggal…" dipilih', () => {
    const onApplyMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <PhoneDateRangeSheet
        isOpen={true}
        selectedRange="hari-ini"
        onClose={onCloseMock}
        onApply={onApplyMock}
      />
    );

    expect(screen.getByText('Rentang waktu')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tanggal:')).not.toBeInTheDocument();

    // Klik opsi "Pilih tanggal…"
    fireEvent.click(screen.getByText('Pilih tanggal…'));

    // Input tanggal sekarang muncul
    const dateInput = screen.getByLabelText('Tanggal:') as HTMLInputElement;
    expect(dateInput).toBeInTheDocument();

    // Ubah tanggal
    fireEvent.change(dateInput, { target: { value: '2026-10-21' } });

    // Terapkan
    fireEvent.click(screen.getByRole('button', { name: 'Terapkan' }));

    expect(onApplyMock).toHaveBeenCalledWith('hari-ini', '2026-10-21');
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('PhoneDateRangeSheet menutup saat overlay luar diklik', () => {
    const onCloseMock = vi.fn();
    render(
      <PhoneDateRangeSheet
        isOpen={true}
        selectedRange="hari-ini"
        onClose={onCloseMock}
        onApply={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog', { name: 'Rentang waktu' });
    fireEvent.click(dialog);

    expect(onCloseMock).toHaveBeenCalled();
  });
});
