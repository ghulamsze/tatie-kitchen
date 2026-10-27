import React from 'react';
import { Dialog, Button } from '../../design/components/index.ts';
import { MenuItem, MenuVariant } from '../../lib/supabase/types.ts';
import { formatRupiah } from '../../lib/format/formatters.ts';

export interface MenuVariantDialogProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectVariant: (variant: MenuVariant) => void;
}

export const MenuVariantDialog: React.FC<MenuVariantDialogProps> = ({
  item,
  isOpen,
  onClose,
  onSelectVariant,
}) => {
  if (!item || !item.variants || item.variants.length === 0) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      description="Pilih ukuran, isi, atau varian harga untuk pesanan ini"
    >
      <div
        className="tk-custom-slider"
        style={{
          display: 'grid',
          gridTemplateColumns: item.variants.length > 4 ? 'repeat(2, 1fr)' : '1fr',
          gap: '10px',
          margin: '12px 0 16px',
          maxHeight: '340px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {item.variants.map((variant) => (
          <button
            key={variant.name}
            type="button"
            onClick={() => onSelectVariant(variant)}
            className="tk-btn-flat"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--r-md)',
              background: 'var(--card-sub)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              width: '100%',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span
              style={{
                fontSize: 'var(--t-sm)',
                fontWeight: 700,
                color: 'var(--ink)',
              }}
            >
              {variant.name}
            </span>
            <b
              style={{
                fontSize: 'var(--t-sm)',
                fontWeight: 800,
                color: 'var(--accent)',
                marginLeft: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              {formatRupiah(variant.price_idr)}
            </b>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <Button
          variant="flat"
          size="md"
          onClick={onClose}
          style={{ width: '100%' }}
        >
          Batal
        </Button>
      </div>
    </Dialog>
  );
};
