import { useRef, useState, useEffect, useCallback } from 'react';
import { NavItem } from '../../design/components/NavbarPill.tsx';
import { triggerHapticSwipe } from '../../lib/device/haptics.ts';

export interface UsePhoneSwipeNavOptions {
  tabs: NavItem[];
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  isSwipeEnabled?: boolean;
}

const isModalActive = (): boolean => {
  if (typeof document === 'undefined') return false;
  return (
    document.body.classList.contains('has-modal') ||
    document.body.classList.contains('tk-modal-open') ||
    document.body.classList.contains('tk-has-modal') ||
    Boolean(document.querySelector('.tk-phone-overlay, .tk-sheet, .tk-dialog'))
  );
};

export function usePhoneSwipeNav({
  tabs,
  activeTab,
  onTabChange,
  isSwipeEnabled = true,
}: UsePhoneSwipeNavOptions) {
  const activeIndex = Math.max(0, tabs.indexOf(activeTab));
  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;

  const [progress, setProgress] = useState<number>(activeIndex);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const tRef = useRef<number>(activeIndex);
  const isDraggingRef = useRef<boolean>(false);
  const rAFRef = useRef<number | null>(null);

  // References ke elemen DOM untuk manipulasi langsung hardware-accelerated 60/120 FPS
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const navbarRef = useRef<HTMLElement | null>(null);

  // Pointer tracking untuk gesture swipe layar horizontal iOS-tuned
  const pointerActiveRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const hasDecidedDirectionRef = useRef<boolean>(false);
  const isLockedOutRef = useRef<boolean>(false);
  const capturedElementRef = useRef<HTMLDivElement | null>(null);
  const capturedPointerIdRef = useRef<number | null>(null);

  // Terapkan nilai t langsung ke DOM transform, background, indicator, dan tombol navbar
  const applyT = useCallback((t: number, dragging: boolean) => {
    tRef.current = t;

    if (containerRef.current) {
      containerRef.current.style.setProperty('--bg-t', String(t));
    }

    if (trackRef.current) {
      trackRef.current.style.transition = dragging
        ? 'none'
        : 'transform 260ms cubic-bezier(0.25, 1, 0.5, 1)';
      trackRef.current.style.transform = `translate3d(calc(-${t} * 100%), 0, 0)`;
    }

    // Manipulasi indikator navbar langsung secara hardware-accelerated tanpa blocking React render
    if (indicatorRef.current && navbarRef.current) {
      const navW = navbarRef.current.offsetWidth || 320;
      const padding = 4;
      const innerW = navW - padding * 2;
      const itemW = innerW / tabs.length;
      const left = padding + t * itemW;
      indicatorRef.current.style.transition = dragging
        ? 'none'
        : 'transform 260ms cubic-bezier(0.25, 1, 0.5, 1), width 260ms cubic-bezier(0.25, 1, 0.5, 1)';
      indicatorRef.current.style.transform = `translate3d(${left}px, 0, 0)`;
      indicatorRef.current.style.width = `${itemW}px`;
    }

    // Update active visual pada tombol navbar secara real-time
    if (navbarRef.current) {
      const nearestIdx = Math.round(t);
      const buttons = navbarRef.current.querySelectorAll<HTMLButtonElement>('.tk-navbar-item');
      buttons.forEach((btn, idx) => {
        const isNear = idx === nearestIdx;
        if (isNear) {
          btn.setAttribute('data-active', 'true');
        } else {
          btn.removeAttribute('data-active');
        }
      });
    }
  }, [tabs.length]);

  // Animasi halus menuju target tab index
  const animateTo = useCallback((targetIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(tabs.length - 1, targetIndex));
    activeIndexRef.current = clampedIndex;

    applyT(clampedIndex, false);
    setProgress(clampedIndex);

    const nextTab = tabs[clampedIndex];
    if (nextTab && nextTab !== activeTab) {
      onTabChange(nextTab);
    }
  }, [applyT, tabs, activeTab, onTabChange]);

  // Sinkronisasi saat activeTab berubah dari luar (misal klik navbar)
  useEffect(() => {
    if (!isDraggingRef.current) {
      const idx = Math.max(0, tabs.indexOf(activeTab));
      if (Math.abs(tRef.current - idx) > 0.001) {
        animateTo(idx);
      }
    }
  }, [activeTab, tabs, animateTo]);

  // Pointer Handlers untuk Pager
  const handlePagerPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Nonaktifkan swipe gestures sepenuhnya jika bukan iOS (misal Android phone)
    if (!isSwipeEnabled) return;

    if (isModalActive()) return;

    // Abaikan klik kanan atau secondary pointer
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Abaikan jika pointer mengenai input, tombol, atau slider kustom horizontal
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, button, .tk-category-bar, .tk-custom-slider-x')) {
      return;
    }

    pointerActiveRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lastXRef.current = e.clientX;
    startTimeRef.current = performance.now();
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    hasDecidedDirectionRef.current = false;
    isLockedOutRef.current = false;
    capturedElementRef.current = e.currentTarget;
    capturedPointerIdRef.current = e.pointerId;
  }, [isSwipeEnabled]);

  const handlePagerPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSwipeEnabled || !pointerActiveRef.current || isLockedOutRef.current) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // 1. Fase deteksi arah: respon instan tanpa lag (threshold rendah 3px)
    if (!hasDecidedDirectionRef.current) {
      // Tunggu hingga ada gerakan minimal 3px
      if (absDx < 3 && absDy < 3) {
        return;
      }

      // Jika gerak vertikal lebih dominan (scroll halaman atas-bawah), kunci swipe horizontal
      if (absDy >= absDx * 0.8) {
        hasDecidedDirectionRef.current = true;
        isLockedOutRef.current = true;
        return;
      }

      // Jika gerak horizontal, aktifkan swipe seketika
      if (absDx >= 3) {
        hasDecidedDirectionRef.current = true;
        isDraggingRef.current = true;
        setIsDragging(true);

        try {
          if (capturedElementRef.current && capturedPointerIdRef.current !== null) {
            capturedElementRef.current.setPointerCapture(capturedPointerIdRef.current);
          }
        } catch {
          // ignore
        }
      }
    }

    // 2. Mode Geser Layar Aktif (Dragging) - dioptimalkan dengan rAF agar 60/120 FPS bebas lag
    if (isDraggingRef.current) {
      const now = performance.now();
      const dt = Math.max(1, now - lastTimeRef.current);
      const stepDx = e.clientX - lastXRef.current;
      velocityRef.current = stepDx / dt;
      lastXRef.current = e.clientX;
      lastTimeRef.current = now;

      const currIdx = activeIndexRef.current;
      let effectiveDx = dx;

      // Rubber-band resistance di batas ujung kiri/kanan (khas iOS)
      if (currIdx === 0 && dx > 0) {
        effectiveDx = dx * 0.32;
      } else if (currIdx === tabs.length - 1 && dx < 0) {
        effectiveDx = dx * 0.32;
      }

      const containerWidth = containerRef.current?.clientWidth || window.innerWidth || 390;
      const deltaT = -effectiveDx / containerWidth;
      const newT = currIdx + deltaT;
      const clampedT = Math.max(-0.12, Math.min(tabs.length - 1 + 0.12, newT));

      if (rAFRef.current !== null) {
        cancelAnimationFrame(rAFRef.current);
      }
      rAFRef.current = requestAnimationFrame(() => {
        applyT(clampedT, true);
        rAFRef.current = null;
      });
    }
  }, [applyT, isSwipeEnabled, tabs.length]);

  const handlePagerPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSwipeEnabled || !pointerActiveRef.current) return;
    pointerActiveRef.current = false;

    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }

    try {
      if (capturedElementRef.current && capturedPointerIdRef.current !== null) {
        capturedElementRef.current.releasePointerCapture(capturedPointerIdRef.current);
      }
    } catch {
      // ignore
    }
    capturedElementRef.current = null;
    capturedPointerIdRef.current = null;

    if (!isDraggingRef.current) {
      return;
    }

    const totalDx = e.clientX - startXRef.current;
    const totalDt = Math.max(1, performance.now() - startTimeRef.current);
    const velocity = Math.abs(totalDx) / totalDt;
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth || 390;

    // Threshold swipe diturunkan secara drastis (hanya butuh geser 8% lebar layar atau flick ringan velocity > 0.07)
    const isSwipe = Math.abs(totalDx) >= containerWidth * 0.08 || velocity > 0.07;

    const currIdx = activeIndexRef.current;
    let targetIndex = currIdx;

    if (isSwipe) {
      if (totalDx < 0) {
        targetIndex = Math.min(tabs.length - 1, currIdx + 1);
      } else if (totalDx > 0) {
        targetIndex = Math.max(0, currIdx - 1);
      }
    }

    isDraggingRef.current = false;
    setIsDragging(false);

    // Berikan Haptic Feedback jika gestur swipe berhasil berpindah tab di iOS!
    if (targetIndex !== currIdx) {
      triggerHapticSwipe();
    }

    animateTo(targetIndex);
  }, [animateTo, isSwipeEnabled, tabs.length]);

  const handlePagerPointerCancel = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSwipeEnabled) return;
    pointerActiveRef.current = false;
    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    try {
      if (capturedElementRef.current && capturedPointerIdRef.current !== null) {
        capturedElementRef.current.releasePointerCapture(capturedPointerIdRef.current);
      }
    } catch {
      // ignore
    }
    capturedElementRef.current = null;
    capturedPointerIdRef.current = null;

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      animateTo(activeIndexRef.current);
    }
  }, [animateTo, isSwipeEnabled]);

  const scrollToTab = useCallback((item: NavItem) => {
    const idx = tabs.indexOf(item);
    if (idx >= 0) {
      animateTo(idx);
    }
  }, [tabs, animateTo]);

  return {
    progress,
    isDragging,
    containerRef,
    trackRef,
    indicatorRef,
    navbarRef,
    handlePagerPointerDown,
    handlePagerPointerMove,
    handlePagerPointerUp,
    handlePagerPointerCancel,
    scrollToTab,
  };
}
