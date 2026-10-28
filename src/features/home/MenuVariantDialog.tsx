import React from 'react';
import { Dialog } from '../../design/components/Dialog.tsx';
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

  const isCakeUltah = item.name.toLowerCase().includes('cake') || item.name.toLowerCase().includes('ulang tahun');

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      description={
        isCakeUltah
          ? 'Pilih varian harga kue ulang tahun untuk pesanan ini'
          : 'Pilih varian atau ukuran untuk pesanan ini'
      }
    >
      {isCakeUltah ? (
        /* Varian Cake Ultah: Bubble Pill */
        <div
          className="tk-custom-slider"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            margin: '10px -4px 14px -4px',
            padding: '6px 4px 6px 4px',
            maxHeight: '340px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {item.variants.map((variant) => (
            <button
              key={variant.name}
              type="button"
              onClick={() => onSelectVariant(variant)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                height: '48px',
                borderRadius: 'var(--r-pill)',
                background: 'color-mix(in srgb, var(--acrylic) 85%, transparent)',
                border: '1.5px solid var(--ctl-line)',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 16%, var(--acrylic))';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px color-mix(in srgb, var(--accent) 25%, transparent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--ctl-line)';
                e.currentTarget.style.background = 'color-mix(in srgb, var(--acrylic) 85%, transparent)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
              }}
            >
              <span
                style={{
                  fontSize: 'var(--t-sm)',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  letterSpacing: '0.02em',
                }}
              >
                {formatRupiah(variant.price_idr)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        /* Varian Menu Konsisten (Pizza, Donat, Brownies, Bolu, dll.) */
        <div
          className="tk-custom-slider"
          style={{
            display: 'grid',
            gridTemplateColumns: item.variants.length > 3 ? 'repeat(2, 1fr)' : '1fr',
            gap: '12px',
            margin: '10px -4px 14px -4px',
            padding: '6px 4px 6px 4px',
            maxHeight: '340px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {item.variants.map((variant) => {
            const isNamePriceLike =
              variant.name.toLowerCase().startsWith('rp') ||
              variant.name.replace(/\D/g, '') === variant.price_idr.toString();

            return (
              <button
                key={variant.name}
                type="button"
                onClick={() => onSelectVariant(variant)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  borderRadius: 'var(--r-lg)',
                  background: 'color-mix(in srgb, var(--acrylic) 85%, transparent)',
                  border: '1.5px solid var(--ctl-line)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 14%, var(--acrylic))';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px color-mix(in srgb, var(--accent) 20%, transparent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--ctl-line)';
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--acrylic) 85%, transparent)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
              >
                {!isNamePriceLike && (
                  <span
                    style={{
                      fontSize: 'var(--t-sm)',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {variant.name}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 'var(--t-xs)',
                    fontWeight: 800,
                    color: 'var(--accent)',
                    padding: '4px 10px',
                    borderRadius: 'var(--r-pill)',
                    background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                    marginLeft: isNamePriceLike ? 0 : 'auto',
                    width: isNamePriceLike ? '100%' : 'auto',
                    textAlign: isNamePriceLike ? 'center' : 'right',
                  }}
                >
                  {formatRupiah(variant.price_idr)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Dialog>
  );
};
