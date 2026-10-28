import React, { useRef, useState, useEffect } from 'react';
import { MenuItem } from '../../lib/supabase/types.ts';
import { useMenuStore, sanitizeMenuPhotoPath } from '../../stores/menuStore.ts';
import { formatRupiah } from '../../lib/format/formatters.ts';
import { triggerHapticFeedback } from '../../lib/device/haptics.ts';

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
  const isPinned = useMenuStore((state) => state.isItemPinned(item.id, item.name));
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
  const didHoldRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    hasMovedRef.current = false;
    didHoldRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      if (!hasMovedRef.current) {
        didHoldRef.current = true;
        setIsHolding(false);
        triggerHapticFeedback([30]);
        onHold(item);
      }
    }, 450); // Tahan kartu ~0,45 detik tanpa bergeser
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
    // Jika pointer bergerak (pengguna sedang scrolling) atau sedang hold buka detail, jangan tambahkan item
    if (hasMovedRef.current || didHoldRef.current) {
      e.stopPropagation();
      didHoldRef.current = false;
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

  const cleanedPhotoPath = sanitizeMenuPhotoPath(item.name, item.photo_path);
  const hasPhotoUrl = Boolean(cleanedPhotoPath && cleanedPhotoPath.trim().length > 0);

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
            ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%), url('${cleanedPhotoPath}') center/cover no-repeat`
            : backgroundGradient,
        }}
      />
      <div className="blur-layer" />

      {/* Pin Badge jika disematkan ke paling atas (Seimbang dan proporsional dengan price-tag di sampingnya) */}
      {isPinned && (
        <span
          className="g-liquid"
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            height: '28px',
            padding: '4px 10px',
            borderRadius: 'var(--r-pill)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            zIndex: 4,
            background: 'color-mix(in srgb, var(--accent) 85%, transparent)',
            color: '#ffffff',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
            boxSizing: 'border-box',
            border: '1px solid rgba(255, 255, 255, 0.40)',
          }}
          title="Menu disematkan di paling atas"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 3a1 1 0 0 1 .117 1.993L16 5v4.586l1.707 1.707A1 1 0 0 1 17.79 12.7l-.083.093H13v7a1 1 0 0 1-1.993.117L11 20v-7.207H6.293a1 1 0 0 1-.787-1.614l.08-.086L7.293 9.586V5a1 1 0 0 1-.117-1.993L7 3h9z" />
          </svg>
        </span>
      )}

      {/* Tag Harga Liquid Glass di Sudut Kanan Atas */}
      <span className="g-liquid price-tag">
        {item.variants && item.variants.length > 0
          ? `Mulai ${formatRupiah(item.price_idr)}`
          : formatRupiah(item.price_idr)}
      </span>

      {/* Nama Menu di Kiri Bawah */}
      <b style={{ position: 'relative', zIndex: 2, fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', color: 'var(--ink)' }}>
        {item.name}
      </b>
    </div>
  );
});
