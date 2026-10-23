import React, { useState } from 'react';
import { useCashierStore } from '../../../stores/cashierStore.ts';
import { AppearanceSheet } from '../../../features/akun/AppearanceSheet.tsx';
import { Button } from '../../../design/components/Button.tsx';

export const PhoneAccountScreen: React.FC = () => {
  const { cashiers } = useCashierStore();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);

  const activeCashiers = cashiers.filter((c) => c.active);

  return (
    <div className="tk-phone-screen">
      <h1 className="tk-phone-title">Akun</h1>

      <div className="g-acrylic tk-phone-hero" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--r-lg)',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 'var(--t-xl)',
            lineHeight: 'var(--l-xl)',
            fontWeight: 800,
            marginBottom: '8px',
          }}
        >
          P
        </div>
        <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', color: 'var(--ink)' }}>
          Pemilik
        </b>
        <span style={{ fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', color: 'var(--ink-3)' }}>
          Tati’e Kitchen
        </span>
      </div>

      <h2 className="tk-phone-section-title">Kasir</h2>
      <div className="tk-phone-list-card" style={{ marginBottom: '16px' }}>
        {activeCashiers.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 'var(--t-sm)' }}>
            Belum ada kasir aktif
          </div>
        ) : (
          activeCashiers.map((cashier) => (
            <div key={cashier.id} className="tk-phone-row" style={{ cursor: 'default' }}>
              <b style={{ fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)' }}>{cashier.name}</b>
              <span style={{ color: 'var(--ink-3)', fontSize: 'var(--t-xs)' }}>Aktif</span>
            </div>
          ))
        )}
      </div>

      <div
        className="g-liquid"
        onClick={() => setIsAppearanceOpen(true)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderRadius: 'var(--r-md)',
          fontWeight: 700,
          fontSize: 'var(--t-md)',
          lineHeight: 'var(--l-md)',
          marginBottom: '12px',
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="tk-phone-dot" />
          Tampilan
        </span>
        <span style={{ color: 'var(--ink-3)' }}>▾</span>
      </div>

      <div
        className="g-liquid"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '14px 20px',
          borderRadius: 'var(--r-md)',
          fontWeight: 700,
          fontSize: 'var(--t-md)',
          lineHeight: 'var(--l-md)',
          marginBottom: '12px',
          cursor: 'pointer',
          color: 'var(--ink)',
        }}
      >
        Cetak menu
      </div>

      <Button
        variant="flat"
        size="md"
        onClick={() => {}}
        style={{ width: '100%', marginTop: '4px' }}
      >
        Keluar
      </Button>

      <AppearanceSheet
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
      />
    </div>
  );
};
