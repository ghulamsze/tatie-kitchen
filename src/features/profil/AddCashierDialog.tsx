import React, { useState } from 'react';
import { Dialog, InputField, Button } from '../../design/components/index.ts';

export interface AddCashierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}

export const AddCashierDialog: React.FC<AddCashierDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');
      await onAdd(name.trim());
      setName('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan kasir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah kasir"
      description="Nama baru langsung muncul di layar pilih profil."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <InputField
            placeholder="Nama kasir"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={isSubmitting}
            error={Boolean(error)}
          />
          {error && (
            <span style={{ color: 'var(--danger)', fontSize: 'var(--t-xs)', lineHeight: 'var(--l-xs)', marginTop: '4px', display: 'block' }}>
              {error}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="flat"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ flex: 1 }}
          >
            Batal
          </Button>
          <Button
            variant="lime"
            size="md"
            type="submit"
            disabled={!name.trim() || isSubmitting}
            style={{ flex: 1 }}
          >
            {isSubmitting ? 'Menyimpan...' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
