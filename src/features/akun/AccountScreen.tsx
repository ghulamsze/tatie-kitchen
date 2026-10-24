import React, { useState } from 'react';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { AppearanceSheet } from './AppearanceSheet.tsx';
import { PrinterSheet } from './PrinterSheet.tsx';
import { Button } from '../../design/components/Button.tsx';

export interface AccountScreenProps {
  onChangeCashier: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = React.memo(({ onChangeCashier }) => {
  const { activeCashier, shiftStartTime } = useCashierStore();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);

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
        paddingBottom: '88px', // Ruang untuk navbar pil di bawah (56px navbar + 16px bottom + 16px clearance)
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
          gap: '14px',
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

        {/* Tombol Tampilan (Lebar) & Tombol Printer (Icon SVG Saja) */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
          <button
            type="button"
            className="tk-btn-appearance"
            onClick={() => setIsAppearanceOpen(true)}
            aria-haspopup="dialog"
            aria-label="Atur tampilan tema dan warna"
            style={{
              flex: 1,
              minWidth: 0,
              height: '48px',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="tk-dot-color" />
              <span>Tampilan</span>
            </span>
            <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>▾</span>
          </button>

          <button
            type="button"
            className="tk-btn-icon-circle"
            onClick={() => setIsPrinterOpen(true)}
            aria-haspopup="dialog"
            aria-label="Pengaturan printer thermal"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" rx="1" />
            </svg>
          </button>
        </div>

        {/* Tombol Ganti Kasir (Tinggi 48px Sama Persis dengan Tampilan & Printer) */}
        <Button
          variant="flat"
          size="md"
          onClick={onChangeCashier}
          style={{ width: '100%', height: '48px' }}
        >
          Ganti kasir
        </Button>

        {/* Versi Aplikasi */}
        <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)', marginTop: '2px' }}>
          v0.1.0
        </span>
      </div>

      {/* Sheet Tampilan Tema dan Warna */}
      <AppearanceSheet
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
      />

      {/* Sheet Pengaturan Printer Thermal Bluetooth */}
      <PrinterSheet
        isOpen={isPrinterOpen}
        onClose={() => setIsPrinterOpen(false)}
      />
    </div>
  );
});
