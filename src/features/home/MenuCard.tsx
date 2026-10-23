import React, { useRef, useState, useEffect } from 'react';
import { MenuItem } from '../../lib/supabase/types.ts';
import { formatRupiah } from '../../lib/format/formatters.ts';

export interface MenuCardProps {
  item: MenuItem & { hue?: number };
  isHeld?: boolean;
  onAdd: (item: MenuItem) => void;
  onHold: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = React.memo(({
  item,
  isHeld = false,
  onAdd,
  onHold,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const hue = item.hue || 28;

  // Optimasi Performa: Hanya render kartu yang berada di layar (viewport)
  // Kartu di luar layar dimatikan agar hemat memori GPU dan tidak lag
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '120px 0px 120px 0px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    hasMovedRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      if (!hasMovedRef.current) {
        setIsHolding(false);
        onHold(item);
      }
    }, 500); // Tahan kartu ~0,5 detik tanpa bergeser
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMovedRef.current) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      // Jika digeser lebih dari 8px (scrolling), batalkan hold segera
      if (dx > 8 || dy > 8) {
        hasMovedRef.current = true;
        setIsHolding(false);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  };

  const handlePointerUp = () => {
    setIsHolding(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Jika pointer bergerak (pengguna sedang scrolling), jangan tambahkan item
    if (hasMovedRef.current) {
      e.stopPropagation();
      return;
    }
    if (item.available) {
      onAdd(item);
    }
  };

  // Jika kartu berada di luar layar, render wadah ringan tanpa decode foto / blur GPU
  if (!isVisible) {
    return (
      <div
        ref={cardRef}
        className={`tk-menu-card tk-menu-card-offscreen ${!item.available ? 'unavailable' : ''}`}
        aria-hidden="true"
        style={{
          minHeight: '136px',
          height: '136px',
          position: 'relative',
          background: 'var(--surface-sunken)',
          contentVisibility: 'auto',
          containIntrinsicSize: '136px',
        }}
      />
    );
  }

  const backgroundGradient = `radial-gradient(circle at 45% 48%, hsl(${hue} 85% 62%) 0 22%, transparent 48%), radial-gradient(circle at 68% 60%, hsl(${hue + 25} 75% 42%) 0 20%, transparent 46%), hsl(${hue} 42% 20%)`;

  const hasPhotoUrl = Boolean(item.photo_path && item.photo_path.trim().length > 0);

  return (
    <div
      ref={cardRef}
      className={`tk-menu-card ${!item.available ? 'unavailable' : ''} ${isHeld ? 'hold' : ''}`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="button"
      tabIndex={0}
      aria-label={`${item.name}, ${formatRupiah(item.price_idr)}, ${item.available ? 'Tersedia' : 'Habis'}`}
      style={{
        minHeight: '136px',
        position: 'relative',
        contentVisibility: 'auto',
        containIntrinsicSize: '136px',
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
});
