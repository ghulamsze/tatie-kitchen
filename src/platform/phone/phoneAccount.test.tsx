import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhoneAccountScreen } from './screens/PhoneAccountScreen.tsx';

describe('PhoneAccountScreen', () => {
  it('harus merender layar akun kasir di HP', () => {
    render(<PhoneAccountScreen />);
    expect(screen.getByRole('heading', { name: /akun/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /kasir/i })).toBeInTheDocument();
  });
});
