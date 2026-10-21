import React, { useRef } from 'react';
import { MenuItem } from '../../lib/supabase/types.ts';
import { formatRupiah } from '../../lib/format/formatters.ts';

export interface MenuCardProps {
  item: MenuItem & { hue?: number };
  isHeld?: boolean;
  onAdd: (item: MenuItem) => void;
  onHold: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  isHeld = false,
  onAdd,
  onHold,
}) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hue = item.hue || 28;

  const handlePointerDown = () => {
    timerRef.current = setTimeout(() => {
      onHold(item);
    }, 500); // Tahan kartu ~0,5 detik
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (item.available) {
      onAdd(item);
    }
  };

  const backgroundGradient = `radial-gradient(circle at 38% 48%, hsl(${hue} 80% 60%) 0 20%, transparent 46%), radial-gradient(circle at 66% 58%, hsl(${hue + 20} 70% 40%) 0 16%, transparent 44%), hsl(${hue} 40% 24%)`;

  return (
    <div
      className={`tk-menu-card ${!item.available ? 'unavailable' : ''} ${isHeld ? 'hold' : ''}`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      role="button"
      tabIndex={0}
      aria-label={`${item.name}, ${formatRupiah(item.price_idr)}, ${item.available ? 'Tersedia' : 'Habis'}`}
      style={{
        minHeight: '136px',
      }}
    >
      {/* Lapisan foto & gradien warna cadangan */}
      <div
        className="photo-layer"
        style={{
          background: backgroundGradient,
        }}
      />
      <div className="blur-layer" />

      {/* Tag Harga Liquid Glass */}
      <span className="g-liquid price-tag">
        {formatRupiah(item.price_idr)}
      </span>

      {/* Nama Menu */}
      <b>{item.name}</b>
    </div>
  );
};
