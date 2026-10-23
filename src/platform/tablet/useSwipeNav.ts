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

  // Pointer tracking untuk gesture swipe
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

  // Terapkan nilai t langsung ke DOM transform, background, dan tombol navbar
  const applyT = useCallback((t: number, dragging: boolean) => {
    tRef.current = t;
    setProgress(t);
    setIsDragging(dragging);

    if (containerRef.current) {
      containerRef.current.style.setProperty('--bg-t', String(t));
    }

    if (trackRef.current) {
      trackRef.current.style.transition = dragging
        ? 'none'
        : 'transform 220ms cubic-bezier(0, 0, 0.2, 1)';
      trackRef.current.style.transform = `translate3d(calc(-${t} * 100%), 0, 0)`;
    }

    // Perbarui opacity tombol tab navbar secara proporsional tanpa mengubah lebar teks
    if (navbarRef.current) {
      const buttons = navbarRef.current.querySelectorAll<HTMLButtonElement>('.tk-navbar-item');
      buttons.forEach((btn, idx) => {
        const diff = Math.abs(t - idx);
        const weight = Math.max(0, 1 - diff);
        btn.style.opacity = String(0.65 + weight * 0.35);
        btn.style.fontWeight = '700'; // Selalu 700 agar tidak memicu resize navbar
      });
    }
  }, []);

  // Animasi halus 220ms ease-out (tanpa overshoot) menuju tab target (0 = Home, 1 = Riwayat, 2 = Akun)
  const animateTo = useCallback((targetIndex: number) => {
    const clampedTarget = Math.max(0, Math.min(tabs.length - 1, targetIndex));
    tRef.current = clampedTarget;
    setProgress(clampedTarget);
    setIsDragging(false);

    if (containerRef.current) {
      containerRef.current.style.setProperty('--bg-t', String(clampedTarget));
    }

    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 220ms cubic-bezier(0, 0, 0.2, 1)';
      trackRef.current.style.transform = `translate3d(calc(-${clampedTarget} * 100%), 0, 0)`;
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


  // Scroll mouse horizontal saja (deltaX / trackpad geser kiri-kanan) untuk ganti tab
  // Scroll vertikal (deltaY) DIABAIKAN — tidak mengganti tab
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let wheelCooldown = false;

    const handleWheel = (e: WheelEvent) => {
      const absDx = Math.abs(e.deltaX);
      const absDy = Math.abs(e.deltaY);

      // Hanya proses jika gerakan dominan horizontal (deltaX lebih besar dari deltaY)
      // Ini memastikan scroll atas/bawah tidak menggeser tab
      if (absDx <= absDy) return;

      // Jika target adalah elemen yang bisa scroll vertikal, abaikan
      const target = e.target as HTMLElement;
      const scrollable = target.closest<HTMLElement>(
        '.tk-order-cart-items, .tk-category-nav, .tk-full-menu-content'
      );
      if (scrollable && scrollable.scrollHeight > scrollable.clientHeight) return;

      // Ambang minimum deltaX agar tidak terpicu noise kecil trackpad
      if (absDx < 20) return;

      // Blokir scroll browser horizontal
      e.preventDefault();

      // Cooldown 450ms agar tidak loncat 2 tab sekaligus (kecepatan terkontrol)
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
  // Temukan tab diskrit (0, 1, atau 2) dari koordinat horizontal clientX di navbar
  // Hitung progress kontinu t (0..2) dari koordinat horizontal clientX di navbar
  const getContinuousProgressFromClientX = useCallback((clientX: number): number => {
    if (!navbarRef.current) return tRef.current;
    const rect = navbarRef.current.getBoundingClientRect();
    const padding = 4;
    const innerWidth = rect.width - padding * 2;
    if (innerWidth <= 0) return tRef.current;
    const relativeX = clientX - rect.left - padding;
    // Map posisi sentuhan relatif terhadap lebar dalam navbar ke skala progress tab
    const p = (relativeX / innerWidth) * (tabs.length - 1);
    return Math.max(0, Math.min(tabs.length - 1, p));
  }, [tabs.length]);

  // Hitung tab terdekat dari koordinat horizontal clientX di navbar
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

  // Interaksi pada navbar: membedakan antara KETUKAN BIASA dan HOLD/DRAG
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

    // Deteksi HOLD: jika ditekan dan ditahan >= 160ms tanpa dilepas, baru masuk mode hold/scrubbing
    navbarHoldTimerRef.current = window.setTimeout(() => {
      if (isNavbarPointerDownRef.current) {
        isDraggingRef.current = true;
        dragSourceRef.current = 'navbar';
        setIsDragging(true);
        setIsNavbarHolding(true);
        const progressT = getContinuousProgressFromClientX(e.clientX);
        applyT(progressT, true);
      }
    }, 160);
  }, [cancelOngoingAnimation, getContinuousProgressFromClientX, applyT]);

  const handleNavbarPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isNavbarPointerDownRef.current || dragSourceRef.current !== 'navbar') return;

    const dx = Math.abs(e.clientX - navbarPointerStartXRef.current);
    const dy = Math.abs(e.clientY - navbarPointerStartYRef.current);

    // Jika jari bergeser > 6px, segera aktifkan mode hold & drag 1:1 tanpa menunggu timer 160ms
    if (!isDraggingRef.current && (dx > 6 || dy > 6)) {
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
      // Selesai HOLD/DRAG: meluncur halus (smooth snap) ke tab terdekat yang dipilih
      const targetIdx = Math.max(0, Math.min(tabs.length - 1, Math.round(tRef.current)));
      animateTo(targetIdx);
    } else {
      // KETUKAN BIASA: pengguna hanya mengetuk tab secara cepat!
      // Hitung tab berdasarkan koordinat sentuhan dan animasikan langsung ke tab target
      const targetIdx = getNearestTabIndexFromClientX(e.clientX);
      animateTo(targetIdx);
    }
  }, [tabs.length, animateTo, getNearestTabIndexFromClientX]);

  // Pointer events untuk swipe halaman layar (Pager)
  const handlePagerPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Abaikan input teks, textarea, select, dan contenteditable
    if (target.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    // Abaikan klik pada scrollbar vertikal elemen yang scrollable
    const scrollable = target.closest<HTMLElement>('.tk-order-cart-items, .tk-category-nav, .tk-full-menu-content');
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

    // 6px dead zone — lebih ringan sebelum drag horizontal mulai
    if (!hasDecidedDirectionRef.current) {
      if (absDx <= 6 && absDy <= 6) {
        return;
      }

      hasDecidedDirectionRef.current = true;

      // Hanya drag horizontal (|dx| > |dy|) sehingga vertical scrolling di dalam menu card tetap berfungsi
      if (absDy > absDx) {
        isLockedOutRef.current = true;
        return;
      }

      isDraggingRef.current = true;
      setIsDragging(true);

      try {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    if (isDraggingRef.current) {
      const now = performance.now();
      const dt = Math.max(1, now - lastTimeRef.current);
      const stepDx = e.clientX - lastXRef.current;
      velocityRef.current = stepDx / dt;
      lastXRef.current = e.clientX;
      lastTimeRef.current = now;

      // Pergeseran 1:1 mengikuti pointer dengan resistensi halus di tepi (hanya 3 tab: 0, 1, 2)
      const currIdx = activeIndexRef.current;
      let effectiveDx = dx;
      if (currIdx === 0 && dx > 0) {
        // Tarik ke kanan saat berada di Home (ujung kiri)
        effectiveDx = dx * 0.3;
      } else if (currIdx === tabs.length - 1 && dx < 0) {
        // Tarik ke kiri saat berada di Akun (ujung kanan)
        effectiveDx = dx * 0.3;
      }

      const containerWidth = containerRef.current?.clientWidth || 1024;
      const deltaT = -effectiveDx / containerWidth;
      const newT = currIdx + deltaT;
      // Dibatasi ketat dengan rentang resistensi halus, tidak pernah melompat keluar batas
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

    // Redam event click yang terpicu tepat setelah drag selesai
    const suppressClick = (evt: MouseEvent) => {
      evt.stopPropagation();
      evt.preventDefault();
    };
    window.addEventListener('click', suppressClick, { capture: true, once: true });
    setTimeout(() => {
      window.removeEventListener('click', suppressClick, { capture: true });
    }, 120);

    // Kriteria ganti halaman:
    // Drag melewati 20% lebar layar (min 60px) ATAU flick ringan (> 0.4 px/ms DAN >= 30px).
    const totalDx = e.clientX - startXRef.current;
    const totalDt = Math.max(1, performance.now() - startTimeRef.current);
    const velocity = Math.abs(totalDx) / totalDt;
    const containerWidth = containerRef.current?.clientWidth || 1024;
    const threshold20 = Math.max(60, containerWidth * 0.20);

    const isFlick = velocity > 0.4 && Math.abs(totalDx) >= 30;
    const isLongSwipe = Math.abs(totalDx) >= threshold20;

    const currIdx = activeIndexRef.current;
    let targetIndex = currIdx;

    if (isFlick || isLongSwipe) {
      if (totalDx < 0) {
        // Swipe kiri = halaman berikutnya
        targetIndex = Math.min(tabs.length - 1, currIdx + 1);
      } else if (totalDx > 0) {
        // Swipe kanan = halaman sebelumnya
        targetIndex = Math.max(0, currIdx - 1);
      }
    }

    isDraggingRef.current = false;
    setIsDragging(false);

    animateTo(targetIndex);
  }, [animateTo, tabs.length]);

  // Klik langsung tab navbar
  const scrollToTab = useCallback((tab: NavItem) => {
    const targetIndex = Math.max(0, tabs.indexOf(tab));
    animateTo(targetIndex);
  }, [animateTo, tabs]);

  useEffect(() => {
    return () => {
      if (navbarHoldTimerRef.current !== null) {
        clearTimeout(navbarHoldTimerRef.current);
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
    handlePagerPointerDown,
    handlePagerPointerMove,
    handlePagerPointerUp,
    scrollToTab,
  };
}
