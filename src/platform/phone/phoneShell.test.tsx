import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneRoot } from './PhoneRoot.tsx';
import { PhoneDevFrame } from '../../app/PhoneDevFrame.tsx';
import { DeviceInfo } from '../../lib/device/detect.ts';
import { useHistoryStore } from '../../stores/historyStore.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';

describe('PhoneRoot & PhoneDevFrame (Fase 1 & 2)', () => {
  beforeEach(() => {
    useHistoryStore.setState({ orders: [] });
    useCashierStore.setState({
      cashiers: [
        { id: 'c1', name: 'Robertus Amaresi', active: true, shop_id: 's1', created_at: '' },
        { id: 'c2', name: 'Puspitawati', active: true, shop_id: 's1', created_at: '' },
      ],
    });
  });

  it('harus merender layar Home secara default dengan navbar pil', () => {
    render(<PhoneRoot />);

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('Total transaksi hari ini')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Riwayat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Akun' })).toBeInTheDocument();
  });

  it('harus dapat berpindah antar-tab dengan mengetuk navbar pil', () => {
    render(<PhoneRoot />);

    fireEvent.click(screen.getByRole('button', { name: 'Riwayat' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Riwayat' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Akun' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Akun' })).toBeInTheDocument();
    expect(screen.getByText('Pemilik')).toBeInTheDocument();
    expect(screen.getByText('Robertus Amaresi')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
  });

  it('PhoneDevFrame harus membungkus konten ponsel dan menampilkan status bar di laptop dev mode', () => {
    const mockDevice: DeviceInfo = {
      platform: 'android',
      formFactor: 'phone',
      source: 'override',
      native: false,
    };

    render(
      <PhoneDevFrame device={mockDevice}>
        <div data-testid="phone-content">Konten Ponsel</div>
      </PhoneDevFrame>
    );

    expect(screen.getByTestId('phone-content')).toBeInTheDocument();
    expect(screen.getByText('10.04')).toBeInTheDocument();
    expect(screen.getByText('5G')).toBeInTheDocument();
  });
});
