import { useRef, useState, useEffect, useCallback } from 'react';
import { NavItem } from '../../design/components/NavbarPill.tsx';

export interface UseSwipeNavOptions {
  tabs: NavItem[];
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
}

export function useSwipeNav({
  tabs,
  activeTab,
  onTabChange,
}: UseSwipeNavOptions) {
  const activeIndex = Math.max(0, tabs.indexOf(activeTab));
  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;

  const [progress, setProgress] = useState<number>(activeIndex);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isNavbarHolding, setIsNavbarHolding] = useState<boolean>(false);

  const tRef = useRef<number>(activeIndex);
  const isDraggingRef = useRef<boolean>(false);
  const navbarHoldTimerRef = useRef<number | null>(null);
  const navbarPointerStartXRef = useRef<number>(0);
  const navbarPointerStartYRef = useRef<number>(0);
  const isNavbarPointerDownRef = useRef<boolean>(false);

  // References ke elemen DOM untuk manipulasi langsung hardware-accelerated 60/120 FPS
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const navbarRef = useRef<HTMLElement | null>(null);

  // Pointer tracking untuk gesture swipe layar horizontal
  const pointerActiveRef = useRef<boolean>(false);
  const dragSourceRef = useRef<'navbar' | 'pager' | null>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const hasDecidedDirectionRef = useRef<boolean>(false);
  const isLockedOutRef = useRef<boolean>(false);
  const isCategoryBarRef = useRef<boolean>(false);
  const scrollableTargetRef = useRef<HTMLElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Terapkan nilai t langsung ke DOM transform, background, indicator, dan tombol navbar
  const applyT = useCallback((t: number, dragging: boolean) => {
    tRef.current = t;

    if (containerRef.current) {
      containerRef.current.style.setProperty('--bg-t', String(t));
    }

    if (trackRef.current) {
      trackRef.current.style.transition = dragging
        ? 'none'
        : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)';
      trackRef.current.style.transform = `translate3d(calc(-${t} * 100%), 0, 0)`;
    }

    // Manipulasi indikator navbar langsung secara hardware-accelerated 60/120fps tanpa blocking React render
    if (indicatorRef.current && navbarRef.current) {
      const navW = navbarRef.current.offsetWidth || 320;
      const padding = 4;
      const innerW = navW - padding * 2;
      const itemW = innerW / tabs.length;
      const left = padding + t * itemW;
      indicatorRef.current.style.transition = dragging
        ? 'none'
        : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), width 200ms cubic-bezier(0.16, 1, 0.3, 1)';
      indicatorRef.current.style.transform = `translate3d(${left}px, 0, 0)`;
      indicatorRef.current.style.width = `${itemW}px`;
    }

    // Perbarui opacity tombol tab navbar secara proporsional tanpa mengubah lebar teks
    if (navbarRef.current) {
      const buttons = navbarRef.current.querySelectorAll<HTMLButtonElement>('.tk-navbar-item');
      buttons.forEach((btn, idx) => {
        const diff = Math.abs(t - idx);
        const weight = Math.max(0, 1 - diff);
        btn.style.opacity = String(0.65 + weight * 0.35);
        btn.style.fontWeight = '700';
      });
    }

    // Saat dragging aktif, hindari re-render React agar gesture swipe terasa instan dan ringan
    if (!dragging) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setProgress(t);
    }
  }, [tabs.length]);

  // Animasi halus 200ms cubic-bezier menuju tab target (0 = Home, 1 = Riwayat, 2 = Akun)
  const animateTo = useCallback((targetIndex: number) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const clampedTarget = Math.max(0, Math.min(tabs.length - 1, targetIndex));
    tRef.current = clampedTarget;
    setProgress(clampedTarget);
    setIsDragging(false);

    if (containerRef.current) {
      containerRef.current.style.setProperty('--bg-t', String(clampedTarget));
    }

    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)';
      trackRef.current.style.transform = `translate3d(calc(-${clampedTarget} * 100%), 0, 0)`;
    }

    if (indicatorRef.current && navbarRef.current) {
      const navW = navbarRef.current.offsetWidth || 320;
      const padding = 4;
      const innerW = navW - padding * 2;
      const itemW = innerW / tabs.length;
      const left = padding + clampedTarget * itemW;
      indicatorRef.current.style.transition = 'transform 240ms cubic-bezier(0.2, 0.9, 0.3, 1), width 240ms cubic-bezier(0.2, 0.9, 0.3, 1)';
      indicatorRef.current.style.transform = `translate3d(${left}px, 0, 0)`;
      indicatorRef.current.style.width = `${itemW}px`;
    }

    onTabChange(tabs[clampedTarget]);
  }, [onTabChange, tabs]);

  // Batalkan animasi yang sedang berjalan secara instan saat ada gesture baru
  const cancelOngoingAnimation = useCallback(() => {
    if (trackRef.current) {
      const compStyle = window.getComputedStyle(trackRef.current);
      const transform = compStyle.transform;
      if (transform && transform !== 'none') {
        try {
          const matrix = new DOMMatrixReadOnly(transform);
          const currentTranslateX = matrix.m41;
          const containerWidth = containerRef.current?.clientWidth || 1024;
          const currT = Math.max(0, Math.min(tabs.length - 1, -currentTranslateX / containerWidth));
          tRef.current = currT;
          setProgress(currT);
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = `translate3d(${currentTranslateX}px, 0, 0)`;
        } catch {
          trackRef.current.style.transition = 'none';
        }
      } else {
        trackRef.current.style.transition = 'none';
      }
    }
  }, [tabs.length]);

  // Sinkronisasi saat activeTab berubah dari luar
  useEffect(() => {
    const targetIdx = Math.max(0, tabs.indexOf(activeTab));
    if (!isDraggingRef.current && Math.abs(tRef.current - targetIdx) > 0.01) {
      animateTo(targetIdx);
    }
  }, [activeTab, tabs, animateTo]);

  // Mouse wheel horizontal (deltaX / trackpad dua jari)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let wheelCooldown = false;

    const handleWheel = (e: WheelEvent) => {
      const absDx = Math.abs(e.deltaX);
      const absDy = Math.abs(e.deltaY);

      if (absDx <= absDy) return;

      const target = e.target as HTMLElement;
      const scrollable = target.closest<HTMLElement>(
        '.tk-order-cart-items, .tk-category-nav, .tk-full-menu-content'
      );
      if (scrollable && scrollable.scrollHeight > scrollable.clientHeight) return;

      if (absDx < 20) return;

      e.preventDefault();

      if (wheelCooldown) return;
      wheelCooldown = true;
      setTimeout(() => { wheelCooldown = false; }, 450);

      const currIdx = activeIndexRef.current;
      if (e.deltaX > 0) {
        animateTo(Math.min(tabs.length - 1, currIdx + 1));
      } else {
        animateTo(Math.max(0, currIdx - 1));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [animateTo, tabs.length]);

  const getContinuousProgressFromClientX = useCallback((clientX: number): number => {
    if (!navbarRef.current) return tRef.current;
    const rect = navbarRef.current.getBoundingClientRect();
    const padding = 4;
    const innerWidth = rect.width - padding * 2;
    if (innerWidth <= 0) return tRef.current;
    const relativeX = clientX - rect.left - padding;
    const p = (relativeX / innerWidth) * (tabs.length - 1);
    return Math.max(0, Math.min(tabs.length - 1, p));
  }, [tabs.length]);

  const getNearestTabIndexFromClientX = useCallback((clientX: number): number => {
    if (!navbarRef.current) return activeIndexRef.current;
    const rect = navbarRef.current.getBoundingClientRect();
    const padding = 4;
    const innerWidth = rect.width - padding * 2;
    if (innerWidth <= 0) return activeIndexRef.current;
    const relativeX = clientX - rect.left - padding;
    const itemWidth = innerWidth / tabs.length;
    const index = Math.floor(relativeX / itemWidth);
    return Math.max(0, Math.min(tabs.length - 1, Math.max(0, index)));
  }, [tabs.length]);

  // Interaksi pada navbar (tap langsung & hold/scrub)
  const handleNavbarPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    cancelOngoingAnimation();

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    isNavbarPointerDownRef.current = true;
    navbarPointerStartXRef.current = e.clientX;
    navbarPointerStartYRef.current = e.clientY;
    dragSourceRef.current = 'navbar';

    if (navbarHoldTimerRef.current !== null) {
      clearTimeout(navbarHoldTimerRef.current);
      navbarHoldTimerRef.current = null;
    }

    // Deteksi HOLD lebih lama (450ms) agar ketukan biasa tidak terhitung sebagai hold
    navbarHoldTimerRef.current = window.setTimeout(() => {
      if (isNavbarPointerDownRef.current) {
        isDraggingRef.current = true;
        dragSourceRef.current = 'navbar';
        setIsDragging(true);
        setIsNavbarHolding(true);
        const progressT = getContinuousProgressFromClientX(e.clientX);
        applyT(progressT, true);
      }
    }, 450);
  }, [cancelOngoingAnimation, getContinuousProgressFromClientX, applyT]);

  const handleNavbarPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isNavbarPointerDownRef.current || dragSourceRef.current !== 'navbar') return;

    const dx = Math.abs(e.clientX - navbarPointerStartXRef.current);
    const dy = Math.abs(e.clientY - navbarPointerStartYRef.current);

    // Perlu gerakan yang jelas (> 16px) untuk memicu drag agar ketukan biasa tidak terganggu
    if (!isDraggingRef.current && (dx > 16 || dy > 16)) {
      if (navbarHoldTimerRef.current !== null) {
        clearTimeout(navbarHoldTimerRef.current);
        navbarHoldTimerRef.current = null;
      }
      isDraggingRef.current = true;
      setIsDragging(true);
      setIsNavbarHolding(true);
    }

    if (isDraggingRef.current) {
      const progressT = getContinuousProgressFromClientX(e.clientX);
      applyT(progressT, true);
    }
  }, [getContinuousProgressFromClientX, applyT]);

  const handleNavbarPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (dragSourceRef.current !== 'navbar') return;

    if (navbarHoldTimerRef.current !== null) {
      clearTimeout(navbarHoldTimerRef.current);
      navbarHoldTimerRef.current = null;
    }

    const wasHolding = isDraggingRef.current;
    isNavbarPointerDownRef.current = false;
    isDraggingRef.current = false;
    dragSourceRef.current = null;
    setIsDragging(false);
    setIsNavbarHolding(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (wasHolding) {
      const targetIdx = Math.max(0, Math.min(tabs.length - 1, Math.round(tRef.current)));
      animateTo(targetIdx);
    } else {
      const targetIdx = getNearestTabIndexFromClientX(e.clientX);
      animateTo(targetIdx);
    }
  }, [tabs.length, animateTo, getNearestTabIndexFromClientX]);

  const handleNavbarPointerCancel = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (navbarHoldTimerRef.current !== null) {
      clearTimeout(navbarHoldTimerRef.current);
      navbarHoldTimerRef.current = null;
    }
    isNavbarPointerDownRef.current = false;
    isDraggingRef.current = false;
    dragSourceRef.current = null;
    setIsDragging(false);
    setIsNavbarHolding(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const targetIdx = Math.max(0, Math.min(tabs.length - 1, Math.round(tRef.current)));
    animateTo(targetIdx);
  }, [tabs.length, animateTo]);

  // Pointer events untuk swipe halaman layar horizontal (Pager)
  const handlePagerPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (target.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    // Isolasi gestur slider chip kategori: jika sentuh bar kategori, izinkan scroll chip
    const isCategoryBar = Boolean(
      target.closest('.tk-category-nav, .tk-chips-bar, [data-gesture-isolate="horizontal"]')
    );
    isCategoryBarRef.current = isCategoryBar;

    const scrollable = target.closest<HTMLElement>(
      '.tk-order-cart-items, .tk-category-nav, .tk-full-menu-content, .tk-menu-grid, .tk-history-container'
    );
    scrollableTargetRef.current = scrollable;

    if (scrollable && scrollable.scrollHeight > scrollable.clientHeight) {
      const rect = scrollable.getBoundingClientRect();
      if (e.clientX > rect.left + scrollable.clientWidth) {
        return;
      }
    }

    cancelOngoingAnimation();

    pointerActiveRef.current = true;
    dragSourceRef.current = 'pager';
    isDraggingRef.current = false;
    hasDecidedDirectionRef.current = false;
    isLockedOutRef.current = false;

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startTimeRef.current = performance.now();
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
  }, [cancelOngoingAnimation]);

  const handlePagerPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current || dragSourceRef.current !== 'pager' || isLockedOutRef.current) {
      return;
    }

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (!hasDecidedDirectionRef.current) {
      if (absDx < 4 && absDy < 4) {
        return;
      }

      // Jika sentuh slider chip kategori, izinkan scroll horizontal chip tanpa ganti tab
      if (isCategoryBarRef.current) {
        hasDecidedDirectionRef.current = true;
        isLockedOutRef.current = true;
        return;
      }

      // Jika sentuh area konten gulir (grid menu atau daftar riwayat):
      if (scrollableTargetRef.current) {
        // Hanya kunci ke scroll vertikal jika gerakan murni vertikal dominan
        if (absDy >= 12 && absDy > absDx * 1.5) {
          hasDecidedDirectionRef.current = true;
          isLockedOutRef.current = true;
          return;
        }
        // Swipe horizontal di atas scrollable: sangat responsif (absDx >= 8px)
        if (absDx >= 8 && absDx >= absDy * 0.9) {
          hasDecidedDirectionRef.current = true;
          isDraggingRef.current = true;
          setIsDragging(true);
          try {
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          } catch {
            // ignore
          }
          return;
        }
      }

      // Scroll vertikal konten di luar scrollable
      if (absDy >= 12 && absDy > absDx * 1.5) {
        hasDecidedDirectionRef.current = true;
        isLockedOutRef.current = true;
        return;
      }

      // Swipe tab horizontal layar: ringan dan langsung responsif (absDx >= 7px)
      if (absDx >= 7 && absDx >= absDy * 0.85) {
        hasDecidedDirectionRef.current = true;
        isDraggingRef.current = true;
        setIsDragging(true);
        try {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        return;
      }
    }

    // Mode SWIPE HORIZONTAL
    if (isDraggingRef.current) {
      const now = performance.now();
      const dt = Math.max(1, now - lastTimeRef.current);
      const stepDx = e.clientX - lastXRef.current;
      velocityRef.current = stepDx / dt;
      lastXRef.current = e.clientX;
      lastTimeRef.current = now;

      const currIdx = activeIndexRef.current;
      let effectiveDx = dx;
      if (currIdx === 0 && dx > 0) {
        effectiveDx = dx * 0.35;
      } else if (currIdx === tabs.length - 1 && dx < 0) {
        effectiveDx = dx * 0.35;
      }

      const containerWidth = containerRef.current?.clientWidth || 390;
      const deltaT = -effectiveDx / containerWidth;
      const newT = currIdx + deltaT;
      const clampedT = Math.max(-0.15, Math.min(tabs.length - 1 + 0.15, newT));

      applyT(clampedT, true);
    }
  }, [applyT, tabs.length]);

  const handlePagerPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current || dragSourceRef.current !== 'pager') {
      return;
    }
    pointerActiveRef.current = false;
    dragSourceRef.current = null;

    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!isDraggingRef.current) {
      return;
    }

    const totalDx = e.clientX - startXRef.current;
    const totalDt = Math.max(1, performance.now() - startTimeRef.current);
    const velocity = Math.abs(totalDx) / totalDt;
    const containerWidth = containerRef.current?.clientWidth || 390;
    // Ambang batas swipe lebih ringan agar geser layar sangat gesit dan enteng
    const threshold = Math.min(36, Math.max(20, containerWidth * 0.07));

    const isFlick = velocity > 0.09 && Math.abs(totalDx) >= 12;
    const isSwipe = Math.abs(totalDx) >= threshold;

    const currIdx = activeIndexRef.current;
    let targetIndex = currIdx;

    if (isFlick || isSwipe) {
      if (totalDx < 0) {
        targetIndex = Math.min(tabs.length - 1, currIdx + 1);
      } else if (totalDx > 0) {
        targetIndex = Math.max(0, currIdx - 1);
      }
    }

    isDraggingRef.current = false;
    setIsDragging(false);

    animateTo(targetIndex);
  }, [animateTo, tabs.length]);

  const handlePagerPointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointerActiveRef.current = false;
    dragSourceRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const targetIdx = Math.max(0, Math.min(tabs.length - 1, Math.round(tRef.current)));
    animateTo(targetIdx);
  }, [animateTo, tabs.length]);

  const scrollToTab = useCallback((tab: NavItem) => {
    const targetIndex = Math.max(0, tabs.indexOf(tab));
    animateTo(targetIndex);
  }, [animateTo, tabs]);

  useEffect(() => {
    return () => {
      if (navbarHoldTimerRef.current !== null) {
        clearTimeout(navbarHoldTimerRef.current);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    progress,
    isDragging,
    isNavbarHolding,
    containerRef,
    trackRef,
    indicatorRef,
    navbarRef,
    handleNavbarPointerDown,
    handleNavbarPointerMove,
    handleNavbarPointerUp,
    handleNavbarPointerCancel,
    handlePagerPointerDown,
    handlePagerPointerMove,
    handlePagerPointerUp,
    handlePagerPointerCancel,
    scrollToTab,
  };
}
