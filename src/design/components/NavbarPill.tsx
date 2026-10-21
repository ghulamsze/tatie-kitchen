import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';

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
  const internalIndicatorRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabMeasurementsRef = useRef<{ left: number; width: number }[]>([]);

  const [internalIsDragging, setInternalIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(activeIndex);
  const isDraggingRef = useRef(false);

  // Ukur offsetLeft dan offsetWidth setiap tab dari DOM layout
  const measureTabs = useCallback((): { left: number; width: number }[] => {
    const navEl = internalNavRef.current;
    const measurements = tabRefs.current.map((btn, index) => {
      if (btn && btn.offsetWidth > 0) {
        return {
          left: btn.offsetLeft,
          width: btn.offsetWidth,
        };
      }
      // Fallback untuk lingkungan test (jsdom) atau layout sebelum render font
      const navW = navEl?.offsetWidth || 320;
      const fallbackW = Math.max(60, (navW - 8) / items.length);
      return {
        left: 4 + index * fallbackW,
        width: fallbackW,
      };
    });
    tabMeasurementsRef.current = measurements;
    return measurements;
  }, [items.length]);

  // Perbarui posisi dan lebar pill (transform translate3d + width)
  const applyIndicatorGeometry = useCallback((p: number, animate: boolean) => {
    const indicator = internalIndicatorRef.current;
    if (!indicator) return;

    let measurements = tabMeasurementsRef.current;
    if (!measurements || measurements.length === 0 || measurements.every((m) => m.width === 0)) {
      measurements = measureTabs();
    }
    if (!measurements || measurements.length === 0) return;

    const clampedP = Math.max(0, Math.min(items.length - 1, p));
    const i0 = Math.floor(clampedP);
    const i1 = Math.min(items.length - 1, Math.ceil(clampedP));
    const frac = clampedP - i0;

    const m0 = measurements[i0] || { left: 0, width: 0 };
    const m1 = measurements[i1] || m0;

    const left = m0.left + (m1.left - m0.left) * frac;
    const width = m0.width + (m1.width - m0.width) * frac;

    // Batalkan animasi sebelumnya jika gesture baru dimulai atau saat drag 1:1
    if (animate) {
      indicator.style.transition = 'transform 220ms cubic-bezier(0, 0, 0.2, 1), width 220ms cubic-bezier(0, 0, 0.2, 1)';
    } else {
      indicator.style.transition = 'none';
    }

    indicator.style.transform = `translate3d(${left}px, 0, 0)`;
    indicator.style.width = `${width}px`;
  }, [items.length, measureTabs]);

  // Perhitungan progress drag jika NavbarPill digunakan mandiri
  const calculateProgress = useCallback((clientX: number): number => {
    const el = internalNavRef.current;
    if (!el) return activeIndex;
    const rect = el.getBoundingClientRect();
    const padding = 4;
    const totalWidth = rect.width - padding * 2;
    const itemWidth = totalWidth / items.length;
    const relativeX = clientX - rect.left - padding;
    const rawIndex = (relativeX - itemWidth / 2) / itemWidth;

    return Math.max(0, Math.min(items.length - 1, rawIndex));
  }, [activeIndex, items.length]);

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
    applyIndicatorGeometry(p, false);
    onDragProgress?.(p);
  };

  const handleInternalPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current || isBlocked) return;
    const p = calculateProgress(e.clientX);
    setDragProgress(p);
    applyIndicatorGeometry(p, false);
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

  // Pasang ResizeObserver dan resize listener untuk kalkulasi ulang saat ukuran layar berubah
  useEffect(() => {
    const navEl = internalNavRef.current;
    if (!navEl) return;

    const handleResize = () => {
      measureTabs();
      applyIndicatorGeometry(effectiveProgress, false);
    };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    if (ro) {
      ro.observe(navEl);
    }
    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [effectiveProgress, measureTabs, applyIndicatorGeometry]);

  // Update geometri pill saat progress/activeItem berubah
  useLayoutEffect(() => {
    if (activeDragging) {
      applyIndicatorGeometry(effectiveProgress, false);
    } else {
      applyIndicatorGeometry(activeIndex, true);
    }
  }, [effectiveProgress, activeIndex, activeDragging, applyIndicatorGeometry]);

  // Pada transitionend, snap tepat ke tab target terukur
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== internalIndicatorRef.current) return;
    const measurements = tabMeasurementsRef.current;
    const target = measurements[activeIndex];
    const indicator = internalIndicatorRef.current;
    if (target && indicator) {
      indicator.style.transition = 'none';
      indicator.style.transform = `translate3d(${target.left}px, 0, 0)`;
      indicator.style.width = `${target.width}px`;
    }
  };

  const isRealtimeMoving = activeDragging || Math.abs(effectiveProgress - activeIndex) > 0.005;

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
        overflow: 'hidden',
      }}
    >
      {/* Elastic Liquid Glass Sliding Indicator dengan offsetLeft & offsetWidth terukur */}
      <div
        ref={(el) => {
          internalIndicatorRef.current = el;
          if (externalIndicatorRef) {
            if (typeof externalIndicatorRef === 'function') {
              externalIndicatorRef(el);
            } else {
              (externalIndicatorRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            }
          }
        }}
        className={`tk-nav-elastic-indicator ${isRealtimeMoving ? 'dragging' : ''}`}
        onTransitionEnd={handleTransitionEnd}
        aria-hidden="true"
      />
      {items.map((item, idx) => {
        const diff = Math.abs(effectiveProgress - idx);
        const weight = Math.max(0, 1 - diff);
        const isCurrentActive = activeItem === item;

        return (
          <button
            key={item}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
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
