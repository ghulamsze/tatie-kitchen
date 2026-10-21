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
  const [progress, setProgress] = useState<number>(activeIndex);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const tRef = useRef<number>(activeIndex);
  const isDraggingRef = useRef<boolean>(false);
  const animRafRef = useRef<number | null>(null);

  // References ke elemen DOM untuk manipulasi langsung hardware-accelerated 60/120 FPS
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const navbarRef = useRef<HTMLElement | null>(null);

  // Pointer tracking untuk velocity dan pergerakan 1:1
  const dragSourceRef = useRef<'navbar' | 'pager' | null>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const startTRef = useRef<number>(activeIndex);
  const lastXRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean>(false);

  // Terapkan nilai t langsung ke DOM transform, indicator, dan CSS variable --bg-t
  const applyT = useCallback((t: number, dragging: boolean) => {
    tRef.current = t;
    setProgress(t);
    setIsDragging(dragging);

    if (containerRef.current) {
      containerRef.current.style.setProperty('--bg-t', String(t));
    }

    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(calc(-${t} * 100%), 0, 0)`;
      trackRef.current.style.transition = dragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    }

    if (indicatorRef.current) {
      indicatorRef.current.style.transform = `translate3d(calc(${t} * 100%), 0, 0)`;
      indicatorRef.current.style.transition = dragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    }

    // Perbarui bobot dan opacity tombol tab navbar secara real-time
    if (navbarRef.current) {
      const buttons = navbarRef.current.querySelectorAll<HTMLButtonElement>('.tk-navbar-item');
      buttons.forEach((btn, idx) => {
        const diff = Math.abs(t - idx);
        const weight = Math.max(0, 1 - diff);
        btn.style.opacity = String(0.65 + weight * 0.35);
        btn.style.fontWeight = weight > 0.5 ? '800' : '700';
      });
    }
  }, []);

  // Animasi soft cubic ease-out saat pointer dilepas (~280ms)
  const animateTo = useCallback((targetIndex: number) => {
    if (animRafRef.current !== null) {
      cancelAnimationFrame(animRafRef.current);
      animRafRef.current = null;
    }

    const startVal = tRef.current;
    const distance = targetIndex - startVal;
    if (Math.abs(distance) < 0.001) {
      applyT(targetIndex, false);
      onTabChange(tabs[targetIndex]);
      return;
    }

    const duration = 280; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const factor = Math.min(1, elapsed / duration);
      // Soft cubic ease-out
      const ease = 1 - Math.pow(1 - factor, 3);
      const current = startVal + distance * ease;

      applyT(current, false);

      if (factor < 1) {
        animRafRef.current = requestAnimationFrame(step);
      } else {
        animRafRef.current = null;
        applyT(targetIndex, false);
        onTabChange(tabs[targetIndex]);
      }
    };

    animRafRef.current = requestAnimationFrame(step);
  }, [applyT, onTabChange, tabs]);

  // Sinkronisasi saat activeTab berubah dari luar
  useEffect(() => {
    const targetIdx = Math.max(0, tabs.indexOf(activeTab));
    if (!isDraggingRef.current && Math.abs(tRef.current - targetIdx) > 0.01) {
      animateTo(targetIdx);
    }
  }, [activeTab, tabs, animateTo]);

  // Bersihkan rAF saat unmount
  useEffect(() => {
    return () => {
      if (animRafRef.current !== null) {
        cancelAnimationFrame(animRafRef.current);
      }
    };
  }, []);

  // Hitung progress kontinu t (0..2) dari koordinat pointer horizontal relatif terhadap lebar navbar
  const calculateNavbarT = useCallback((clientX: number): number => {
    if (!navbarRef.current) return tRef.current;
    const rect = navbarRef.current.getBoundingClientRect();
    const padding = 4;
    const totalWidth = rect.width - padding * 2;
    const itemWidth = totalWidth / tabs.length;
    const relativeX = clientX - rect.left - padding;
    const rawT = (relativeX - itemWidth / 2) / itemWidth;
    return Math.max(0, Math.min(tabs.length - 1, rawT));
  }, [tabs.length]);

  // Gesture hold-and-drag pada Navbar: mengikuti pointer 1:1, tanpa auto-snap selama hold
  const handleNavbarPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (animRafRef.current !== null) {
      cancelAnimationFrame(animRafRef.current);
      animRafRef.current = null;
    }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    isDraggingRef.current = true;
    dragSourceRef.current = 'navbar';
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;

    const newT = calculateNavbarT(e.clientX);
    applyT(newT, true);
  }, [calculateNavbarT, applyT]);

  const handleNavbarPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current || dragSourceRef.current !== 'navbar') return;

    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dx = e.clientX - lastXRef.current;
    velocityRef.current = dx / dt;
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;

    const newT = calculateNavbarT(e.clientX);
    applyT(newT, true);
  }, [calculateNavbarT, applyT]);

  const handleNavbarPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current || dragSourceRef.current !== 'navbar') return;
    isDraggingRef.current = false;
    dragSourceRef.current = null;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const currentT = tRef.current;
    const v = velocityRef.current; // px per ms

    let targetIndex: number;
    // Flick threshold ~ 0.35 px/ms
    if (v > 0.35) {
      targetIndex = Math.min(tabs.length - 1, Math.floor(currentT) + 1);
    } else if (v < -0.35) {
      targetIndex = Math.max(0, Math.ceil(currentT) - 1);
    } else {
      targetIndex = Math.max(0, Math.min(tabs.length - 1, Math.round(currentT)));
    }

    animateTo(targetIndex);
  }, [animateTo, tabs.length]);

  // Gesture swipe pada halaman layar (1:1 pergeseran kontinu)
  const handlePagerPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, button, [role="button"], .tk-keypad-grid, .tk-qty-control')) {
      return;
    }

    if (animRafRef.current !== null) {
      cancelAnimationFrame(animRafRef.current);
      animRafRef.current = null;
    }

    isDraggingRef.current = true;
    dragSourceRef.current = 'pager';
    isHorizontalSwipeRef.current = false;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startTRef.current = tRef.current;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
  }, []);

  const handlePagerPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragSourceRef.current !== 'pager') return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (!isHorizontalSwipeRef.current) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        isHorizontalSwipeRef.current = true;
        try {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      } else if (Math.abs(dy) > 8) {
        isDraggingRef.current = false;
        dragSourceRef.current = null;
        return;
      }
    }

    if (isHorizontalSwipeRef.current) {
      const now = performance.now();
      const dt = Math.max(1, now - lastTimeRef.current);
      const stepDx = e.clientX - lastXRef.current;
      velocityRef.current = stepDx / dt;
      lastXRef.current = e.clientX;
      lastTimeRef.current = now;

      const containerWidth = containerRef.current?.clientWidth || 1024;
      const deltaT = -dx / containerWidth;
      const newT = Math.max(0, Math.min(tabs.length - 1, startTRef.current + deltaT));
      applyT(newT, true);
    }
  }, [applyT, tabs.length]);

  const handlePagerPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragSourceRef.current !== 'pager') return;
    isDraggingRef.current = false;
    dragSourceRef.current = null;

    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!isHorizontalSwipeRef.current) return;

    const currentT = tRef.current;
    const v = velocityRef.current;

    let targetIndex: number;
    if (v > 0.35) {
      targetIndex = Math.max(0, Math.ceil(currentT) - 1);
    } else if (v < -0.35) {
      targetIndex = Math.min(tabs.length - 1, Math.floor(currentT) + 1);
    } else {
      targetIndex = Math.max(0, Math.min(tabs.length - 1, Math.round(currentT)));
    }

    animateTo(targetIndex);
  }, [animateTo, tabs.length]);

  // Klik tab navigasi secara langsung
  const scrollToTab = useCallback((tab: NavItem) => {
    const targetIndex = Math.max(0, tabs.indexOf(tab));
    animateTo(targetIndex);
  }, [animateTo, tabs]);

  return {
    progress,
    isDragging,
    containerRef,
    trackRef,
    indicatorRef,
    navbarRef,
    handleNavbarPointerDown,
    handleNavbarPointerMove,
    handleNavbarPointerUp,
    handlePagerPointerDown,
    handlePagerPointerMove,
    handlePagerPointerUp,
    scrollToTab,
  };
}
