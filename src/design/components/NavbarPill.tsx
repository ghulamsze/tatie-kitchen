import React, { useRef, useState, useCallback } from 'react';

export type NavItem = 'Home' | 'Riwayat' | 'Akun';

export interface NavbarPillProps {
  activeItem: NavItem;
  onSelect: (item: NavItem) => void;
  scrollProgress?: number;
}

export const NavbarPill: React.FC<NavbarPillProps> = ({
  activeItem,
  onSelect,
  scrollProgress,
}) => {
  const items: NavItem[] = ['Home', 'Riwayat', 'Akun'];
  const activeIndex = Math.max(0, items.indexOf(activeItem));

  const navRef = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(activeIndex);
  const isDraggingRef = useRef(false);

  // Perhitungan progress drag terkunci ketat di dalam batas navbar (0 .. items.length - 1)
  const calculateProgress = useCallback((clientX: number): number => {
    if (!navRef.current) return activeIndex;
    const rect = navRef.current.getBoundingClientRect();
    const padding = 4;
    const totalWidth = rect.width - padding * 2;
    const itemWidth = totalWidth / items.length;
    const relativeX = clientX - rect.left - padding;
    const rawIndex = (relativeX - itemWidth / 2) / itemWidth;

    // Batasi ketat 0 sampai 2 agar indikator tidak pernah keluar dari navbar
    return Math.max(0, Math.min(items.length - 1, rawIndex));
  }, [activeIndex, items.length]);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDraggingRef.current = true;
    setIsDragging(true);
    const p = calculateProgress(e.clientX);
    setDragProgress(p);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return;
    const p = calculateProgress(e.clientX);
    setDragProgress(p);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const p = calculateProgress(e.clientX);
    const nearestIndex = Math.max(0, Math.min(items.length - 1, Math.round(p)));
    onSelect(items[nearestIndex]);
  };

  // Posisi progress real-time (baik dari drag navbar maupun swipeable pager gesture Safari)
  const effectiveProgress = isDragging
    ? dragProgress
    : (scrollProgress !== undefined ? scrollProgress : activeIndex);

  const isRealtimeMoving = isDragging || (scrollProgress !== undefined && Math.abs(scrollProgress - activeIndex) > 0.005);

  const currentTranslate = `translateX(calc(${effectiveProgress} * 100%))`;

  return (
    <nav
      ref={navRef}
      className="g-liquid tk-navbar"
      aria-label="Navigasi Utama"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'pointer',
      }}
    >
      {/* Elastic Liquid Glass Sliding Indicator */}
      <div
        className={`tk-nav-elastic-indicator ${isRealtimeMoving ? 'dragging' : ''}`}
        style={{
          width: `calc((100% - 8px) / ${items.length})`,
          transform: currentTranslate,
        }}
        aria-hidden="true"
      />
      {items.map((item, idx) => {
        const diff = Math.abs(effectiveProgress - idx);
        const weight = Math.max(0, 1 - diff); // 1 = aktif penuh, 0 = tidak aktif
        const isCurrentActive = activeItem === item;

        return (
          <button
            key={item}
            type="button"
            className={`tk-navbar-item ${isCurrentActive ? 'active' : ''}`}
            style={{
              opacity: 0.65 + weight * 0.35,
              fontWeight: weight > 0.5 ? 800 : 700,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            aria-current={activeItem === item ? 'page' : undefined}
          >
            {item}
          </button>
        );
      })}
    </nav>
  );
};
