import React, { useRef, useState, useCallback } from 'react';

export type NavItem = 'Home' | 'Riwayat' | 'Akun';

export interface NavbarPillProps {
  activeItem: NavItem;
  onSelect: (item: NavItem) => void;
}

export const NavbarPill: React.FC<NavbarPillProps> = ({
  activeItem,
  onSelect,
}) => {
  const items: NavItem[] = ['Home', 'Riwayat', 'Akun'];
  const activeIndex = Math.max(0, items.indexOf(activeItem));

  const navRef = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(activeIndex);
  const isDraggingRef = useRef(false);

  const calculateProgress = useCallback((clientX: number): number => {
    if (!navRef.current) return activeIndex;
    const rect = navRef.current.getBoundingClientRect();
    const padding = 4;
    const totalWidth = rect.width - padding * 2;
    const itemWidth = totalWidth / 3;
    const relativeX = clientX - rect.left - padding;
    const rawIndex = (relativeX - itemWidth / 2) / itemWidth;

    // Elastisitas rubber band overshoot di ujung kiri & kanan
    if (rawIndex < 0) {
      return rawIndex * 0.35;
    }
    if (rawIndex > 2) {
      return 2 + (rawIndex - 2) * 0.35;
    }
    return rawIndex;
  }, [activeIndex]);

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
    const nearestIndex = Math.max(0, Math.min(2, Math.round(p)));
    onSelect(items[nearestIndex]);
  };

  const currentTranslate = isDragging
    ? `translateX(calc(${dragProgress} * 100%))`
    : `translateX(calc(${activeIndex} * 100%))`;

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
        className={`tk-nav-elastic-indicator ${isDragging ? 'dragging' : ''}`}
        style={{
          transform: currentTranslate,
        }}
        aria-hidden="true"
      />
      {items.map((item, idx) => {
        const isCurrentActive = isDragging
          ? Math.round(dragProgress) === idx
          : activeItem === item;
        return (
          <button
            key={item}
            type="button"
            className={`tk-navbar-item ${isCurrentActive ? 'active' : ''}`}
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
