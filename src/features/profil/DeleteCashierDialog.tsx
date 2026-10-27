import React, { useState } from 'react';
import { Dialog, Button } from '../../design/components/index.ts';
import { Cashier } from '../../lib/supabase/types.ts';
import { isImmutableCashier } from '../../stores/cashierStore.ts';

export interface DeleteCashierDialogProps {
  cashier: Cashier | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cashierId: string) => Promise<void> | void;
}

export const DeleteCashierDialog: React.FC<DeleteCashierDialogProps> = ({
  cashier,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [canConfirm, setCanConfirm] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setCanConfirm(false);
      return undefined;
    }
    setCanConfirm(false);
    const timer = setTimeout(() => setCanConfirm(true), 320);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!cashier || isImmutableCashier(cashier.id, cashier.name)) return null;

  const handleDelete = async () => {
    if (!canConfirm || isDeleting) return;
    try {
      setIsDeleting(true);
      await onConfirm(cashier.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Hapus kasir?"
      description={`Hapus akun kasir "${cashier.name}" dari daftar kasir toko?`}
    >
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <Button
          variant="flat"
          size="md"
          onClick={onClose}
          disabled={isDeleting}
          style={{ flex: 1 }}
        >
          Batal
        </Button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || !canConfirm}
          style={{
            flex: 1,
            height: '44px',
            borderRadius: 'var(--r-md)',
            background: 'var(--danger)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontWeight: 700,
            fontSize: 'var(--t-sm)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.25)',
            cursor: isDeleting || !canConfirm ? 'not-allowed' : 'pointer',
            opacity: canConfirm ? 1 : 0.6,
            pointerEvents: canConfirm ? 'auto' : 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: 'transform 0.1s ease, opacity 0.15s ease',
          }}
        >
          {isDeleting ? 'Menghapus...' : 'Hapus Kasir'}
        </button>
      </div>
    </Dialog>
  );
};
