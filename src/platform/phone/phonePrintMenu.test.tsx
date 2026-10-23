import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneAccountScreen } from './screens/PhoneAccountScreen.tsx';
import { PhonePrintMenuDialog } from './components/PhonePrintMenuDialog.tsx';
import { PrintMenuDocument } from './components/PrintMenuDocument.tsx';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { useShopStore } from '../../stores/shopStore.ts';

describe('PhonePrintMenuDialog & PrintMenuDocument (Fase 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    window.print = vi.fn();

    useShopStore.setState({
      shop: {
        id: 's1',
        name: 'Tati’e Kitchen',
        address: 'Jl. Sam Ratulangi No. 12, Makassar',
        phone_no: '08123456789',
        timezone: 'Asia/Makassar',
        bank_name: 'Bank Kaltimtara',
        bank_account: '1747037252',
        bank_account_holder: 'Hartati Jahri',
        qris_path: '',
      },
    });

    useCashierStore.setState({
      cashiers: [
        { id: 'c1', name: 'Robertus Amaresi', active: true, shop_id: 's1', created_at: '' },
      ],
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('harus merender dialog konfigurasi cetak menu dengan benar', () => {
    render(
      <PhonePrintMenuDialog
        isOpen={true}
        onClose={vi.fn()}
        onPrint={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Dialog Cetak Menu A4' })).toBeInTheDocument();
    expect(screen.getByText('Cetak menu')).toBeInTheDocument();
    expect(screen.getByText(/Menu fisik A4: satu sampul dan tiga halaman isi/)).toBeInTheDocument();
    expect(screen.getByText('Margin normal (2,54 cm)')).toBeInTheDocument();
    expect(screen.getByText('Margin 4433 (kiri 4, atas 4, kanan 3, bawah 3 cm)')).toBeInTheDocument();
    expect(screen.getByText('Hemat tinta (latar terang)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cetak' })).toBeInTheDocument();
  });

  it('harus mengubah opsi margin dan hemat tinta serta memanggil onPrint dan window.print', async () => {
    const onPrintMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <PhonePrintMenuDialog
        isOpen={true}
        onClose={onCloseMock}
        onPrint={onPrintMock}
      />
    );

    // Pilih Margin 4433
    fireEvent.click(screen.getByText('Margin 4433 (kiri 4, atas 4, kanan 3, bawah 3 cm)'));

    // Aktifkan Hemat tinta
    fireEvent.click(screen.getByText('Hemat tinta (latar terang)'));

    // Tekan Cetak
    fireEvent.click(screen.getByRole('button', { name: 'Cetak' }));

    expect(onPrintMock).toHaveBeenCalledWith({
      isMargin4433: true,
      isInkSaver: true,
    });
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('harus menutup dialog saat tombol Batal ditekan', () => {
    const onCloseMock = vi.fn();

    render(
      <PhonePrintMenuDialog
        isOpen={true}
        onClose={onCloseMock}
        onPrint={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('PrintMenuDocument harus merender 4 halaman menu A4 lengkap', () => {
    const { container } = render(
      <PrintMenuDocument
        isMargin4433={true}
        isInkSaver={true}
        isVisibleInPreview={true}
      />
    );

    // Verifikasi kelas konfigurasi
    const mp = container.querySelector('#mp');
    expect(mp).toHaveClass('m4433');
    expect(mp).toHaveClass('ink');

    // Halaman 1 (Cover)
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Makanan')).toBeInTheDocument();
    expect(screen.getByText('Snack')).toBeInTheDocument();
    expect(screen.getByText('Minuman')).toBeInTheDocument();

    // Halaman 2, 3, 4 Headings
    expect(screen.getByRole('heading', { level: 2, name: 'Makanan dan mie' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Camilan dan minuman panas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Minuman dingin' })).toBeInTheDocument();

    // Verifikasi nomor halaman
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
    expect(screen.getByText('3 / 4')).toBeInTheDocument();
    expect(screen.getByText('4 / 4')).toBeInTheDocument();
  });

  it('harus membuka PhonePrintMenuDialog saat tombol Cetak menu di PhoneAccountScreen diklik', () => {
    render(<PhoneAccountScreen />);

    // Dialog awalnya belum terbuka
    expect(screen.queryByRole('dialog', { name: 'Dialog Cetak Menu A4' })).not.toBeInTheDocument();

    // Klik tombol Cetak menu
    fireEvent.click(screen.getByRole('button', { name: 'Cetak menu' }));

    // Sekarang dialog terbuka
    expect(screen.getByRole('dialog', { name: 'Dialog Cetak Menu A4' })).toBeInTheDocument();
  });
});
