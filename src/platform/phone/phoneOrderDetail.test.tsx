import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhoneOrderDetailScreen } from './screens/PhoneOrderDetailScreen.tsx';

describe('PhoneOrderDetailScreen', () => {
  it('harus merender pesan fallback saat belum ada pesanan yang dipilih', () => {
    render(<PhoneOrderDetailScreen />);
    expect(screen.getByText(/tidak ada transaksi yang dipilih/i)).toBeInTheDocument();
  });
});
