import React, { useState } from 'react';
import { useCashierStore, isImmutableCashier } from '../../stores/cashierStore.ts';
import { Cashier } from '../../lib/supabase/types.ts';
import { AddCashierDialog } from './AddCashierDialog.tsx';
import { DeleteCashierDialog } from './DeleteCashierDialog.tsx';

export interface SelectCashierScreenProps {
  onSelectCashier: (cashier: Cashier) => void;
  onOpenDeviceSetup?: () => void;
}

export const SelectCashierScreen: React.FC<SelectCashierScreenProps> = ({
  onSelectCashier,
  onOpenDeviceSetup: _onOpenDeviceSetup,
}) => {
  const { cashiers, activeCashier, setActiveCashier, addNewCashier, removeCashier } = useCashierStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [cashierToDelete, setCashierToDelete] = useState<Cashier | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const holdTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const didTriggerHoldRef = React.useRef(false);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handlePointerDown = (cashier: Cashier) => {
    didTriggerHoldRef.current = false;
    // Dua kasir default tidak dapat dihapus
    if (isImmutableCashier(cashier.id, cashier.name)) {
      return;
    }
    holdTimerRef.current = setTimeout(() => {
      didTriggerHoldRef.current = true;
      setCashierToDelete(cashier);
      setIsDeleteOpen(true);
    }, 550);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleSelect = (cashier: Cashier) => {
    if (didTriggerHoldRef.current) {
      didTriggerHoldRef.current = false;
      return;
    }
    setActiveCashier(cashier);
    onSelectCashier(cashier);
  };

  const handleAdd = async (name: string) => {
    const newCashier = await addNewCashier(name);
    didTriggerHoldRef.current = false;
    setActiveCashier(newCashier);
    onSelectCashier(newCashier);
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
              onPointerDown={() => handlePointerDown(c)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label={`Pilih kasir ${c.name} (Tahan untuk menghapus)`}
              title="Klik untuk memilih, tahan 0.5 detik untuk menghapus"
            >
              <div className="g-liquid tk-avatar-box" style={{ overflow: 'hidden' }}>
                {c.avatar_url ? (
                  <img
                    src={c.avatar_url}
                    alt={c.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getInitials(c.name)
                )}
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

      {/* Dialog Tambah Kasir */}
      <AddCashierDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAdd}
      />

      {/* Dialog Hapus Kasir (Hold Gesture) */}
      <DeleteCashierDialog
        isOpen={isDeleteOpen}
        cashier={cashierToDelete}
        onClose={() => {
          setIsDeleteOpen(false);
          setCashierToDelete(null);
        }}
        onConfirm={async (id) => {
          await removeCashier(id);
        }}
      />
    </div>
  );
};
