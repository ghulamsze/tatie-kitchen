import React, { useRef, useState, useCallback } from 'react';

export type NavItem = 'Home' | 'Riwayat' | 'Akun';

export interface NavbarPillProps {
  activeItem: NavItem;
  onSelect: (item: NavItem) => void;
  scrollProgress?: number;
  progress?: number;
  isDragging?: boolean;
  navRef?: React.Ref<HTMLElement>;
  indicatorRef?: React.Ref<HTMLDivElement>;
  onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLElement>) => void;
  onDragProgress?: (progress: number) => void;
  isBlocked?: boolean;
}

export const NavbarPill: React.FC<NavbarPillProps> = ({
  activeItem,
  onSelect,
  scrollProgress,
  progress,
  isDragging: externalIsDragging,
  navRef: externalNavRef,
  indicatorRef: externalIndicatorRef,
  onPointerDown: externalOnPointerDown,
  onPointerMove: externalOnPointerMove,
  onPointerUp: externalOnPointerUp,
  onPointerCancel: externalOnPointerCancel,
  onDragProgress,
  isBlocked = false,
}) => {
  const items: NavItem[] = ['Home', 'Riwayat', 'Akun'];
  const activeIndex = Math.max(0, items.indexOf(activeItem));

  const internalNavRef = useRef<HTMLElement | null>(null);
  const [internalIsDragging, setInternalIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(activeIndex);
  const isDraggingRef = useRef(false);

  // Perhitungan progress drag jika NavbarPill digunakan mandiri
  const calculateProgress = useCallback((clientX: number): number => {
    const el = (externalNavRef && 'current' in externalNavRef ? externalNavRef.current : null) || internalNavRef.current;
    if (!el) return activeIndex;
    const rect = el.getBoundingClientRect();
    const padding = 4;
    const totalWidth = rect.width - padding * 2;
    const itemWidth = totalWidth / items.length;
    const relativeX = clientX - rect.left - padding;
    const rawIndex = (relativeX - itemWidth / 2) / itemWidth;

    return Math.max(0, Math.min(items.length - 1, rawIndex));
  }, [activeIndex, items.length, externalNavRef]);

  const handleInternalPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (isBlocked) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDraggingRef.current = true;
    setInternalIsDragging(true);
    const p = calculateProgress(e.clientX);
    setDragProgress(p);
    onDragProgress?.(p);
  };

  const handleInternalPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current || isBlocked) return;
    const p = calculateProgress(e.clientX);
    setDragProgress(p);
    onDragProgress?.(p);
  };

  const handleInternalPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setInternalIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const p = calculateProgress(e.clientX);
    const nearestIndex = Math.max(0, Math.min(items.length - 1, Math.round(p)));
    onSelect(items[nearestIndex]);
  };

  const activeDragging = externalIsDragging !== undefined ? externalIsDragging : internalIsDragging;

  // Nilai progress kontinu t (0..2)
  const effectiveProgress = progress !== undefined
    ? progress
    : (activeDragging
        ? dragProgress
        : (scrollProgress !== undefined ? scrollProgress : activeIndex));

  const isRealtimeMoving = activeDragging || Math.abs(effectiveProgress - activeIndex) > 0.005;

  const currentTranslate = `translate3d(calc(${effectiveProgress} * 100%), 0, 0)`;

  return (
    <nav
      ref={(el) => {
        internalNavRef.current = el;
        if (externalNavRef) {
          if (typeof externalNavRef === 'function') {
            externalNavRef(el);
          } else {
            (externalNavRef as React.MutableRefObject<HTMLElement | null>).current = el;
          }
        }
      }}
      className={`g-liquid tk-navbar ${isBlocked ? 'blocked' : ''}`}
      aria-label="Navigasi Utama"
      onPointerDown={externalOnPointerDown || handleInternalPointerDown}
      onPointerMove={externalOnPointerMove || handleInternalPointerMove}
      onPointerUp={externalOnPointerUp || handleInternalPointerUp}
      onPointerCancel={externalOnPointerCancel || externalOnPointerUp || handleInternalPointerUp}
      style={{
        touchAction: 'none',
        cursor: isBlocked ? 'default' : (activeDragging ? 'grabbing' : 'pointer'),
        pointerEvents: isBlocked ? 'none' : 'auto',
        filter: isBlocked ? 'blur(3px)' : 'none',
        opacity: isBlocked ? 0.45 : 1,
        transition: 'opacity 0.25s ease, filter 0.25s ease',
      }}
    >
      {/* Elastic Liquid Glass Sliding Indicator */}
      <div
        ref={externalIndicatorRef}
        className={`tk-nav-elastic-indicator ${isRealtimeMoving ? 'dragging' : ''}`}
        style={{
          width: `calc((100% - 8px) / ${items.length})`,
          transform: currentTranslate,
          transition: activeDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        aria-hidden="true"
      />
      {items.map((item, idx) => {
        const diff = Math.abs(effectiveProgress - idx);
        const weight = Math.max(0, 1 - diff);
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
              if (!isBlocked) onSelect(item);
            }}
            aria-current={activeItem === item ? 'page' : undefined}
            disabled={isBlocked}
          >
            {item}
          </button>
        );
      })}
    </nav>
  );
};
