import React, { useState } from 'react';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { AppearanceSheet } from './AppearanceSheet.tsx';
import { Button } from '../../design/components/Button.tsx';

export interface AccountScreenProps {
  onChangeCashier: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ onChangeCashier }) => {
  const { activeCashier, shiftStartTime } = useCashierStore();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);

  const cashierName = activeCashier?.name || 'Robertus Amaresi';
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div
      className="scr"
      style={{
        width: '1024px',
        height: '640px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: '92px', // Ruang untuk navbar pil di bawah
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="g-acrylic"
        style={{
          width: '420px',
          padding: '36px 44px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        {/* Avatar Kasir Aktif */}
        <div
          className="g-liquid"
          style={{
            width: '112px',
            height: '112px',
            borderRadius: 'var(--r-xl)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 'var(--t-xl)',
            lineHeight: 'var(--l-xl)',
            fontWeight: 800,
          }}
        >
          {getInitials(cashierName)}
        </div>

        {/* Nama dan Jam Tugas */}
        <div>
          <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', display: 'block' }}>
            {cashierName}
          </b>
          <span style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)' }}>
            Bertugas sejak {shiftStartTime}
          </span>
        </div>

        {/* Tombol Tampilan */}
        <button
          type="button"
          className="tk-btn-appearance"
          onClick={() => setIsAppearanceOpen(true)}
          aria-haspopup="dialog"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="tk-dot-color" />
            <span>Tampilan</span>
          </span>
          <span style={{ fontSize: 'var(--t-xs)' }}>▾</span>
        </button>

        {/* Tombol Ganti Kasir */}
        <Button
          variant="flat"
          onClick={onChangeCashier}
          style={{ width: '100%' }}
        >
          Ganti kasir
        </Button>
      </div>

      {/* Sheet Tampilan Tema dan Warna */}
      <AppearanceSheet
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
      />
    </div>
  );
};
