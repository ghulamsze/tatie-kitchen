import React, { useState } from 'react';
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
  const [boluFlavor, setBoluFlavor] = useState<'Vanilla' | 'Pandan'>('Vanilla');

  if (!item || !item.variants || item.variants.length === 0) return null;

  const isBolu = item.name.toLowerCase() === 'bolu';
  const isCakeUltah = item.name.toLowerCase().includes('cake');

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      description={
        isBolu
          ? 'Pilih varian rasa bolu dan ukuran yang diinginkan'
          : isCakeUltah
          ? 'Pilih varian harga cake ultah untuk pesanan ini'
          : 'Pilih varian atau ukuran untuk pesanan ini'
      }
    >
      {isBolu ? (
        /* Alur Khusus Bolu: Pilih Rasa (Vanilla/Pandan) kemudian Ukuran (M/L) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0 20px' }}>
          {/* 1. Opsi Pilihan Rasa: Vanilla / Pandan */}
          <div>
            <span
              style={{
                fontSize: 'var(--t-xs)',
                fontWeight: 800,
                color: 'var(--ink-3)',
                display: 'block',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              1. Pilih Rasa Bolu
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {(['Vanilla', 'Pandan'] as const).map((flavor) => {
                const isSelected = boluFlavor === flavor;
                return (
                  <button
                    key={flavor}
                    type="button"
                    onClick={() => setBoluFlavor(flavor)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      height: '48px',
                      borderRadius: 'var(--r-pill)',
                      background: isSelected
                        ? 'var(--accent)'
                        : 'color-mix(in srgb, var(--acrylic) 85%, transparent)',
                      color: isSelected ? 'var(--on-accent)' : 'var(--ink)',
                      border: isSelected ? '2px solid var(--accent)' : '1.5px solid var(--ctl-line)',
                      fontSize: 'var(--t-sm)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected
                        ? '0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)'
                        : 'none',
                    }}
                  >
                    <span>{flavor}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Opsi Ukuran: M / L */}
          <div>
            <span
              style={{
                fontSize: 'var(--t-xs)',
                fontWeight: 800,
                color: 'var(--ink-3)',
                display: 'block',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              2. Pilih Ukuran
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { size: 'M', price: 50000 },
                { size: 'L', price: 90000 },
              ].map(({ size, price }) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    onSelectVariant({
                      name: `${boluFlavor} - Ukuran ${size}`,
                      price_idr: price,
                    });
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 12px',
                    borderRadius: 'var(--r-lg)',
                    background: 'color-mix(in srgb, var(--acrylic) 85%, transparent)',
                    border: '1.5px solid var(--ctl-line)',
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px color-mix(in srgb, var(--accent) 20%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ctl-line)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: 'var(--t-sm)', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>
                    Ukuran {size}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--t-xs)',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      padding: '4px 12px',
                      borderRadius: 'var(--r-pill)',
                      background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                    }}
                  >
                    {formatRupiah(price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : isCakeUltah ? (
        /* Varian Cake Ultah: Bubble Pill Murni Tanpa Double Text */
        <div
          className="tk-custom-slider"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            margin: '16px 0 20px',
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
        /* Varian Menu Lainnya (Donat, Brownies, dll.): Bubble Card Rapi Tanpa Double Text */
        <div
          className="tk-custom-slider"
          style={{
            display: 'grid',
            gridTemplateColumns: item.variants.length > 3 ? 'repeat(2, 1fr)' : '1fr',
            gap: '12px',
            margin: '16px 0 20px',
            maxHeight: '340px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {item.variants.map((variant) => {
            // Cek apakah nama varian mirip nominal harga untuk mencegah double text
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
                  justifyContent: isNamePriceLike ? 'center' : 'space-between',
                  padding: '12px 16px',
                  height: '48px',
                  borderRadius: 'var(--r-pill)',
                  background: 'color-mix(in srgb, var(--acrylic) 85%, transparent)',
                  border: '1.5px solid var(--ctl-line)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  width: '100%',
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
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {!isNamePriceLike && (
                  <span
                    style={{
                      fontSize: 'var(--t-sm)',
                      fontWeight: 700,
                      color: 'var(--ink)',
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
                    padding: '3px 10px',
                    borderRadius: 'var(--r-pill)',
                    background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                    marginLeft: isNamePriceLike ? '0' : '12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatRupiah(variant.price_idr)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <Button
          variant="flat"
          size="md"
          onClick={onClose}
          style={{ width: '100%', borderRadius: 'var(--r-pill)', height: '44px' }}
        >
          Batal
        </Button>
      </div>
    </Dialog>
  );
};
