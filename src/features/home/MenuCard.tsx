import React, { useRef, useState } from 'react';
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
  const [isHolding, setIsHolding] = useState(false);
  const hue = item.hue || 28;

  const handlePointerDown = () => {
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      setIsHolding(false);
      onHold(item);
    }, 500); // Tahan kartu ~0,5 detik
  };

  const handlePointerUp = () => {
    setIsHolding(false);
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

  const backgroundGradient = `radial-gradient(circle at 45% 48%, hsl(${hue} 85% 62%) 0 22%, transparent 48%), radial-gradient(circle at 68% 60%, hsl(${hue + 25} 75% 42%) 0 20%, transparent 46%), hsl(${hue} 42% 20%)`;

  const hasPhotoUrl = Boolean(item.photo_path && item.photo_path.trim().length > 0);

  return (
    <div
      className={`tk-menu-card ${!item.available ? 'unavailable' : ''} ${isHeld ? 'hold' : ''}`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="button"
      tabIndex={0}
      aria-label={`${item.name}, ${formatRupiah(item.price_idr)}, ${item.available ? 'Tersedia' : 'Habis'}`}
      style={{
        minHeight: '136px',
        position: 'relative',
      }}
    >
      {/* Animasi Garis Memutari Menu saat di-Hold */}
      {isHolding && (
        <svg
          className="tk-hold-svg-border"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="96" height="96" rx="8" ry="8" pathLength="280" />
        </svg>
      )}

      {/* Lapisan foto asli & gradien warna cadangan */}
      <div
        className="photo-layer"
        style={{
          background: hasPhotoUrl
            ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%), url('${item.photo_path}') center/cover no-repeat`
            : backgroundGradient,
        }}
      />
      <div className="blur-layer" />

      {/* Tag Harga Liquid Glass di Sudut Kanan Atas */}
      <span className="g-liquid price-tag">
        {formatRupiah(item.price_idr)}
      </span>

      {/* Nama Menu di Kiri Bawah */}
      <b style={{ position: 'relative', zIndex: 2, fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', color: 'var(--ink)' }}>
        {item.name}
      </b>
    </div>
  );
};
