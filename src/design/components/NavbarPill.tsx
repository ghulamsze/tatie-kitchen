import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';

export type NavItem = 'Beranda' | 'Riwayat' | 'Akun';

export interface NavbarPillProps {
  activeItem: NavItem;
  onSelect: (item: NavItem) => void;
  scrollProgress?: number;
  progress?: number;
  isDragging?: boolean;
  isHolding?: boolean;
  navRef?: React.Ref<HTMLElement>;
  indicatorRef?: React.Ref<HTMLDivElement>;
  onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLElement>) => void;
  onDragProgress?: (progress: number) => void;
  isBlocked?: boolean;
}

const renderNavIcon = (item: NavItem, isActive: boolean) => {
  switch (item) {
    case 'Beranda':
      // Icon Home: active = fill, inactive = outline
      return isActive ? (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
          aria-hidden="true"
        >
          <path d="M11.293 2.293a1 1 0 0 1 1.414 0l9 9A1 1 0 0 1 21 13h-1v7.5A1.5 1.5 0 0 1 18.5 22h-4a1 1 0 0 1-1-1v-4.5a1.5 1.5 0 0 0-3 0V21a1 1 0 0 1-1 1h-4A1.5 1.5 0 0 1 4 20.5V13H3a1 1 0 0 1-.707-1.707l9-9z" />
        </svg>
      ) : (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4.5a1 1 0 0 1-1-1v-4a2 2 0 0 0-4 0v4a1 1 0 0 1-1 1H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
        </svg>
      );
    case 'Riwayat':
      // Icon Menu (3 lines): active = fill, inactive = outline
      return isActive ? (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
          aria-hidden="true"
        >
          <rect x="3" y="4.75" width="18" height="3.5" rx="1.75" />
          <rect x="3" y="10.25" width="18" height="3.5" rx="1.75" />
          <rect x="3" y="15.75" width="18" height="3.5" rx="1.75" />
        </svg>
      ) : (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="4" y1="6.5" x2="20" y2="6.5" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17.5" x2="20" y2="17.5" />
        </svg>
      );
    case 'Akun':
      // Icon Pengaturan (Gear/Settings): active = fill, inactive = outline
      return isActive ? (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM9.456 2.052a1.5 1.5 0 0 1 1.488-.052l.245.127c.475.247.986.377 1.506.38a3.42 3.42 0 0 0 1.504-.378l.247-.128a1.5 1.5 0 0 1 2.062.59l1.196 2.072a1.5 1.5 0 0 1-.417 1.996l-.213.149c-.43.3-.77.7-.992 1.17a3.42 3.42 0 0 0-.001 2.984c.221.47.561.87.992 1.17l.213.149a1.5 1.5 0 0 1 .417 1.996l-1.196 2.072a1.5 1.5 0 0 1-2.062.59l-.247-.128a3.42 3.42 0 0 0-3.01-.002l-.245.128a1.5 1.5 0 0 1-2.062-.59l-1.196-2.072a1.5 1.5 0 0 1 .417-1.996l.213-.149c.43-.3.77-.7.992-1.17a3.42 3.42 0 0 0 0-2.984c-.222-.47-.562-.87-.992-1.17l-.213-.149a1.5 1.5 0 0 1-.417-1.996l1.196-2.072a1.5 1.5 0 0 1 .574-.538z"
          />
        </svg>
      ) : (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
};

export const NavbarPill: React.FC<NavbarPillProps> = ({
  activeItem,
  onSelect,
  scrollProgress,
  progress,
  isDragging: externalIsDragging,
  isHolding: externalIsHolding,
  navRef: externalNavRef,
  indicatorRef: externalIndicatorRef,
  onPointerDown: externalOnPointerDown,
  onPointerMove: externalOnPointerMove,
  onPointerUp: externalOnPointerUp,
  onPointerCancel: externalOnPointerCancel,
  onDragProgress,
  isBlocked = false,
}) => {
  const items: NavItem[] = ['Beranda', 'Riwayat', 'Akun'];
  const activeIndex = Math.max(0, items.indexOf(activeItem));

  const internalNavRef = useRef<HTMLElement | null>(null);
  const internalIndicatorRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabMeasurementsRef = useRef<{ left: number; width: number }[]>([]);

  const [internalIsDragging, setInternalIsDragging] = useState(false);
  const [internalIsHolding, setInternalIsHolding] = useState(false);
  const [dragProgress, setDragProgress] = useState(activeIndex);
  const isDraggingRef = useRef(false);
  const internalHoldTimerRef = useRef<number | null>(null);
  const internalStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const internalPointerDownRef = useRef(false);

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

    let left = m0.left + (m1.left - m0.left) * frac;
    let width = m0.width + (m1.width - m0.width) * frac;

    // Strict boundary clamping: pastikan indikator tidak pernah keluar batas navbar saat di-hold/drag
    const navEl = internalNavRef.current;
    if (navEl && navEl.offsetWidth > 0) {
      const navW = navEl.offsetWidth;
      const minLeft = 4;
      const maxRight = navW - 4;
      if (left < minLeft) {
        width = Math.max(20, width - (minLeft - left));
        left = minLeft;
      }
      if (left + width > maxRight) {
        width = Math.max(20, maxRight - left);
      }
    }

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

  // Perhitungan index tab saat diketuk langsung (tap biasa)
  const getTabIndexFromClientX = useCallback((clientX: number): number => {
    const el = internalNavRef.current;
    if (!el) return activeIndex;
    const rect = el.getBoundingClientRect();
    const padding = 4;
    const innerWidth = rect.width - padding * 2;
    if (innerWidth <= 0) return activeIndex;
    const relativeX = clientX - rect.left - padding;
    const itemWidth = innerWidth / items.length;
    const rawIndex = Math.floor(relativeX / itemWidth);
    return Math.max(0, Math.min(items.length - 1, Math.max(0, rawIndex)));
  }, [activeIndex, items.length]);

  const handleInternalPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (isBlocked) return;
    internalPointerDownRef.current = true;
    internalStartPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    if (internalHoldTimerRef.current !== null) {
      clearTimeout(internalHoldTimerRef.current);
      internalHoldTimerRef.current = null;
    }

    // Deteksi HOLD (300ms) untuk scrubbing antar tab
    internalHoldTimerRef.current = window.setTimeout(() => {
      if (internalPointerDownRef.current) {
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        isDraggingRef.current = true;
        setInternalIsDragging(true);
        setInternalIsHolding(true);
        const p = calculateProgress(e.clientX);
        setDragProgress(p);
        applyIndicatorGeometry(p, false);
        onDragProgress?.(p);
      }
    }, 300);
  };

  const handleInternalPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!internalPointerDownRef.current || isBlocked) return;
    const dx = Math.abs(e.clientX - internalStartPosRef.current.x);
    const dy = Math.abs(e.clientY - internalStartPosRef.current.y);

    if (!isDraggingRef.current && (dx > 10 || dy > 10)) {
      if (internalHoldTimerRef.current !== null) {
        clearTimeout(internalHoldTimerRef.current);
        internalHoldTimerRef.current = null;
      }
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      isDraggingRef.current = true;
      setInternalIsDragging(true);
      setInternalIsHolding(true);
    }

    if (isDraggingRef.current) {
      const p = calculateProgress(e.clientX);
      setDragProgress(p);
      applyIndicatorGeometry(p, false);
      onDragProgress?.(p);
    }
  };

  const handleInternalPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (internalHoldTimerRef.current !== null) {
      clearTimeout(internalHoldTimerRef.current);
      internalHoldTimerRef.current = null;
    }

    const wasDragging = isDraggingRef.current;
    internalPointerDownRef.current = false;
    isDraggingRef.current = false;
    setInternalIsDragging(false);
    setInternalIsHolding(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (isBlocked) return;

    if (wasDragging) {
      const p = calculateProgress(e.clientX);
      const targetIndex = Math.max(0, Math.min(items.length - 1, Math.round(p)));
      onSelect(items[targetIndex]);
    } else {
      const targetIndex = getTabIndexFromClientX(e.clientX);
      onSelect(items[targetIndex]);
    }
  };

  // Pastikan timer dan state hold/drag selalu bersih saat pointerup global
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (internalHoldTimerRef.current !== null) {
        clearTimeout(internalHoldTimerRef.current);
        internalHoldTimerRef.current = null;
      }
      if (internalPointerDownRef.current || isDraggingRef.current) {
        internalPointerDownRef.current = false;
        isDraggingRef.current = false;
        setInternalIsDragging(false);
        setInternalIsHolding(false);
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  const isHolding = externalIsHolding !== undefined ? externalIsHolding : internalIsHolding;
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
      applyIndicatorGeometry(activeIndex, false);
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
  }, [activeIndex, measureTabs, applyIndicatorGeometry]);

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
      className={`g-liquid tk-navbar ${isBlocked ? 'blocked' : ''} ${isHolding ? 'holding' : ''}`}
      aria-label="Navigasi Utama"
      onPointerDown={(e) => {
        if (externalOnPointerDown) externalOnPointerDown(e);
        else handleInternalPointerDown(e);
      }}
      onPointerMove={externalOnPointerMove || handleInternalPointerMove}
      onPointerUp={(e) => {
        if (externalOnPointerUp) externalOnPointerUp(e);
        else handleInternalPointerUp(e);
      }}
      onPointerCancel={(e) => {
        if (externalOnPointerCancel) externalOnPointerCancel(e);
        else if (externalOnPointerUp) externalOnPointerUp(e);
        else handleInternalPointerUp(e);
      }}
      style={{
        touchAction: 'none',
        cursor: isBlocked ? 'default' : (activeDragging ? 'grabbing' : 'pointer'),
        pointerEvents: isBlocked ? 'none' : 'auto',
        filter: isBlocked ? 'blur(3px)' : 'none',
        opacity: isBlocked ? 0.45 : 1,
        transform: `translateX(-50%) scale(${isHolding ? 0.95 : 1})`,
        transition: 'opacity 0.25s ease, filter 0.25s ease, transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease',
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
        const hoveredIdx = (isHolding || activeDragging) ? Math.round(effectiveProgress) : activeIndex;
        const isCurrentActive = (isHolding || activeDragging) ? (idx === hoveredIdx) : (activeItem === item);
        const isCurrentHovered = (isHolding || activeDragging) ? (idx === hoveredIdx) : false;

        const baseOpacity = 0.7 + weight * 0.3;
        // Saat hold: item yang tidak disentuh (weight rendah) lebih redup agar item yang di-hold fokus
        const finalOpacity = (isHolding || activeDragging) ? (isCurrentActive ? 1 : 0.45 + weight * 0.25) : baseOpacity;
        // Saat hold: perbesar pembesaran item yang dilewati jari (1 + weight * 0.18), saat normal sedikit lebih kalem (1 + weight * 0.1)
        const scale = (isHolding || activeDragging) ? (1 + weight * 0.18) : (1 + weight * 0.1);

        return (
          <button
            key={item}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            type="button"
            className={`tk-navbar-item ${isCurrentActive ? 'active' : ''} ${isCurrentHovered ? 'hovered' : ''} ${(isHolding || activeDragging) ? 'in-hold' : ''}`}
            style={{
              opacity: finalOpacity,
              fontWeight: isCurrentActive ? 800 : 700,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: activeDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.15s ease',
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!isBlocked) onSelect(item);
            }}
            onPointerUp={() => {
              if (internalHoldTimerRef.current !== null) {
                clearTimeout(internalHoldTimerRef.current);
                internalHoldTimerRef.current = null;
              }
              if (!isBlocked && !activeDragging && !isHolding) {
                onSelect(item);
              }
            }}
            aria-current={activeItem === item ? 'page' : undefined}
            aria-label={item}
            title={item}
            disabled={isBlocked}
          >
            {renderNavIcon(item, isCurrentActive)}
          </button>
        );
      })}
    </nav>
  );
};
