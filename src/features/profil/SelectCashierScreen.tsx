import React, { useState } from 'react';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { Cashier } from '../../lib/supabase/types.ts';
import { AddCashierDialog } from './AddCashierDialog.tsx';

export interface SelectCashierScreenProps {
  onSelectCashier: (cashier: Cashier) => void;
  onOpenDeviceSetup?: () => void;
}

export const SelectCashierScreen: React.FC<SelectCashierScreenProps> = ({
  onSelectCashier,
  onOpenDeviceSetup,
}) => {
  const { cashiers, activeCashier, setActiveCashier, addNewCashier } = useCashierStore();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleSelect = (cashier: Cashier) => {
    setActiveCashier(cashier);
    onSelectCashier(cashier);
  };

  const handleAdd = async (name: string) => {
    const newCashier = await addNewCashier(name);
    handleSelect(newCashier);
  };

  return (
    <div
      className="scr"
      style={{
        width: '1024px',
        height: '640px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '36px',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <h2
        style={{
          fontSize: 'var(--t-xl)',
          lineHeight: 'var(--l-xl)',
          fontWeight: 800,
          margin: 0,
          letterSpacing: '-0.02em',
        }}
      >
        Siapa yang bertugas?
      </h2>

      {/* Baris Kartu Kasir */}
      <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {cashiers.map((c) => {
          const isSelected = activeCashier?.id === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`tk-cashier-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(c)}
              aria-label={`Pilih kasir ${c.name}`}
            >
              <div className="g-liquid tk-avatar-box">
                {getInitials(c.name)}
              </div>
              <span>{c.name}</span>
            </button>
          );
        })}

        {/* Kartu Tambah Kasir */}
        <button
          type="button"
          className="tk-cashier-card"
          onClick={() => setIsAddOpen(true)}
          aria-label="Tambah kasir baru"
        >
          <div
            className="g-liquid tk-avatar-box"
            style={{ fontWeight: 500 }}
          >
            +
          </div>
          <span>Tambah kasir</span>
        </button>
      </div>

      {/* Tombol Setup Perangkat Pemilik */}
      {onOpenDeviceSetup && (
        <button
          type="button"
          onClick={onOpenDeviceSetup}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            background: 'transparent',
            border: 'none',
            color: 'var(--ink-3)',
            fontSize: 'var(--t-xs)',
            lineHeight: 'var(--l-xs)',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: 'var(--r-sm)',
            textDecoration: 'underline',
          }}
        >
          Masuk Perangkat (Setup Toko)
        </button>
      )}

      {/* Dialog Tambah Kasir */}
      <AddCashierDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
};
