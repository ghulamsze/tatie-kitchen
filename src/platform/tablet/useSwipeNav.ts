import { useRef, useState, useEffect, useCallback } from 'react';
import { NavItem } from '../../design/components/NavbarPill.tsx';

export interface UseSwipeNavOptions {
  tabs: NavItem[];
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  onRefresh?: () => Promise<void> | void;
}

export type PullRefreshState = 'idle' | 'pulling' | 'refreshing' | 'success';

export function useSwipeNav({
  tabs,
  activeTab,
  onTabChange,
  onRefresh,
}: UseSwipeNavOptions) {
  const activeIndex = Math.max(0, tabs.indexOf(activeTab));
  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;

  const [progress, setProgress] = useState<number>(activeIndex);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isNavbarHolding, setIsNavbarHolding] = useState<boolean>(false);
  const [pullState, setPullState] = useState<PullRefreshState>('idle');

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

  // References & state untuk Pull to Refresh ultra smooth (Satu Ikon Saja)
  const pullIndicatorRef = useRef<HTMLDivElement | null>(null);
  const pullIconRef = useRef<HTMLDivElement | null>(null);
  const isPullingRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);
  const pullDistanceRef = useRef<number>(0);
  const scrollableTargetRef = useRef<HTMLElement | null>(null);
  const isInteractiveTargetRef = useRef<boolean>(false);

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
        : 'transform 220ms cubic-bezier(0, 0, 0.2, 1)';
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
        : 'transform 220ms cubic-bezier(0, 0, 0.2, 1), width 220ms cubic-bezier(0, 0, 0.2, 1)';
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
        btn.style.fontWeight = '700'; // Selalu 700 agar tidak memicu resize navbar
      });
    }

    // Throttle React state setProgress dengan requestAnimationFrame agar UI tidak lag saat drag/hold
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        setProgress(tRef.current);
      });
    }
  }, [tabs.length]);

  // Fungsi hardware-accelerated 60/120 FPS untuk menggerakkan indikator pull-to-refresh (satu ikon circular)
  const applyPull = useCallback((dist: number, state: PullRefreshState) => {
    if (!pullIndicatorRef.current) return;
    const el = pullIndicatorRef.current;

    if (state === 'idle') {
      el.style.transition = 'transform 280ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 200ms ease';
      el.style.transform = 'translate3d(-50%, -70px, 0)';
      el.style.opacity = '0';
    } else if (state === 'pulling') {
      el.style.transition = 'none';
      // Dari -70px ke 16px saat dist mencapai threshold mantap 65px
      const y = Math.min(20, -70 + (dist / 65) * 86);
      el.style.transform = `translate3d(-50%, ${y}px, 0)`;
      // Opacity mulai muncul lembut hanya jika tarikan sudah melewati 15px
      el.style.opacity = String(Math.min(1, Math.max(0, (dist - 15) / 25)));

      if (pullIconRef.current) {
        const rot = Math.min(180, (dist / 65) * 180);
        pullIconRef.current.style.transform = `rotate(${rot}deg)`;
        pullIconRef.current.classList.remove('spinning');
      }
    } else if (state === 'refreshing') {
      el.style.transition = 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 200ms ease';
      el.style.transform = 'translate3d(-50%, 16px, 0)';
      el.style.opacity = '1';

      if (pullIconRef.current) {
        pullIconRef.current.style.transform = '';
        pullIconRef.current.classList.add('spinning');
      }
    } else if (state === 'success') {
      el.style.transition = 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 200ms ease';
      el.style.transform = 'translate3d(-50%, 16px, 0)';
      el.style.opacity = '1';

      if (pullIconRef.current) {
        pullIconRef.current.classList.remove('spinning');
        pullIconRef.current.style.transform = 'rotate(0deg)';
      }
    }
  }, []);

  // Animasi halus 220ms ease-out (tanpa overshoot) menuju tab target (0 = Home, 1 = Riwayat, 2 = Akun)
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
      trackRef.current.style.transition = 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)';
      trackRef.current.style.transform = `translate3d(calc(-${clampedTarget} * 100%), 0, 0)`;
    }

    if (indicatorRef.current && navbarRef.current) {
      const navW = navbarRef.current.offsetWidth || 320;
      const padding = 4;
      const innerW = navW - padding * 2;
      const itemW = innerW / tabs.length;
      const left = padding + clampedTarget * itemW;
      indicatorRef.current.style.transition = 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1), width 260ms cubic-bezier(0.2, 0.9, 0.3, 1)';
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


  // Scroll mouse horizontal saja (deltaX / trackpad geser kiri-kanan) untuk ganti tab
  // Scroll vertikal (deltaY) DIABAIKAN â€” tidak mengganti tab
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

  // Pointer events untuk swipe halaman layar (Pager) & Pull-to-Refresh
  const handlePagerPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Abaikan input teks, textarea, select, dan contenteditable
    if (target.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    // Abaikan klik pada scrollbar vertikal elemen yang scrollable
    const scrollable = target.closest<HTMLElement>(
      '.tk-order-cart-items, .tk-category-nav, .tk-full-menu-content, .tk-menu-grid, .tk-history-container'
    );
    scrollableTargetRef.current = scrollable;

    // Abaikan jika interaksi dimulai dari kartu menu, tombol, chip, atau kontrol qty
    // Ini memastikan saat kasir mengetuk/menahan menu, tidak pernah salah terpicu pull-to-refresh
    const isInteractive = Boolean(
      target.closest('.tk-menu-card, button, .tk-chip, .tk-qty-btn, .tk-navbar-item')
    );
    isInteractiveTargetRef.current = isInteractive;

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
    isPullingRef.current = false;
    pullDistanceRef.current = 0;
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

    // Arbitrasi arah geser: PULL DOWN vs SCROLL VERTIKAL vs SWIPE TAB HORIZONTAL
    if (!hasDecidedDirectionRef.current) {
      if (absDx < 6 && absDy < 6) {
        return;
      }

      const isScrollAtTop =
        !scrollableTargetRef.current || scrollableTargetRef.current.scrollTop <= 0;

      // 1. PULL TO REFRESH:
      // Syarat ketat agar TIDAK mudah terpicu:
      // - Bukan dimulai dari kartu menu / tombol interaktif
      // - Tarikan ke bawah mantap (dy >= 28px)
      // - Arah dominan vertikal lurus ke bawah (dy >= absDx * 2.2)
      // - Posisi scroll berada di puncak paling atas (isScrollAtTop)
      // - Tidak sedang dalam proses refresh
      if (
        !isInteractiveTargetRef.current &&
        dy >= 28 &&
        dy >= absDx * 2.2 &&
        isScrollAtTop &&
        !isRefreshingRef.current
      ) {
        hasDecidedDirectionRef.current = true;
        isPullingRef.current = true;
        setPullState('pulling');
        try {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      } else if (absDy > absDx * 1.5 && absDy > 16) {
        // 2. SCROLL VERTIKAL KONTEN BIASA (tidak memicu refresh atau ganti tab)
        hasDecidedDirectionRef.current = true;
        isLockedOutRef.current = true;
        return;
      } else if (absDx >= 8 && absDx >= absDy * 0.6) {
        // 3. SWIPE TAB HORIZONTAL (Home <-> Riwayat <-> Akun)
        hasDecidedDirectionRef.current = true;
        isDraggingRef.current = true;
        setIsDragging(true);

        try {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    }

    // Jika sedang dalam mode PULL TO REFRESH
    if (isPullingRef.current) {
      const rawDy = Math.max(0, e.clientY - startYRef.current);
      // Kurva elastisitas rubber-band iOS-style yang sangat halus
      const pullY = Math.min(84, Math.pow(rawDy, 0.82) * 1.6);
      pullDistanceRef.current = pullY;
      applyPull(pullY, 'pulling');
      return;
    }

    // Jika sedang dalam mode SWIPE HORIZONTAL
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
  }, [applyT, applyPull, tabs.length]);

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

    // Redam event click yang terpicu tepat setelah drag / pull selesai
    const suppressClick = (evt: MouseEvent) => {
      evt.stopPropagation();
      evt.preventDefault();
    };
    window.addEventListener('click', suppressClick, { capture: true, once: true });
    setTimeout(() => {
      window.removeEventListener('click', suppressClick, { capture: true });
    }, 120);

    // Tangani pelepasan PULL TO REFRESH
    if (isPullingRef.current) {
      isPullingRef.current = false;
      const finalPull = pullDistanceRef.current;
      pullDistanceRef.current = 0;

      // Ambang batas ketat: hanya gerakan yang betul-betul ditarik mantap ke bawah (>= 65px)
      if (finalPull >= 65 && onRefresh) {
        isRefreshingRef.current = true;
        setPullState('refreshing');
        applyPull(65, 'refreshing');

        (async () => {
          try {
            await onRefresh();
          } catch {
            // ignore error
          } finally {
            setPullState('success');
            applyPull(65, 'success');
            setTimeout(() => {
              setPullState('idle');
              applyPull(0, 'idle');
              isRefreshingRef.current = false;
            }, 550);
          }
        })();
      } else {
        setPullState('idle');
        applyPull(0, 'idle');
      }
      return;
    }

    if (!isDraggingRef.current) {
      return;
    }

    // Kriteria ganti halaman pada tablet yang sangat mulus & tanpa tenaga berlebih:
    // Cukup geser 50px (atau 5% lebar layar) ATAU flick ringan (> 0.14 px/ms dan geser >= 16px).
    const totalDx = e.clientX - startXRef.current;
    const totalDt = Math.max(1, performance.now() - startTimeRef.current);
    const velocity = Math.abs(totalDx) / totalDt;
    const containerWidth = containerRef.current?.clientWidth || 1024;
    const threshold = Math.min(55, Math.max(40, containerWidth * 0.05));

    const isFlick = velocity > 0.14 && Math.abs(totalDx) >= 16;
    const isSwipe = Math.abs(totalDx) >= threshold;

    const currIdx = activeIndexRef.current;
    let targetIndex = currIdx;

    if (isFlick || isSwipe) {
      if (totalDx < 0) {
        // Swipe kiri = halaman berikutnya (Home -> Riwayat -> Akun)
        targetIndex = Math.min(tabs.length - 1, currIdx + 1);
      } else if (totalDx > 0) {
        // Swipe kanan = halaman sebelumnya
        targetIndex = Math.max(0, currIdx - 1);
      }
    }

    isDraggingRef.current = false;
    setIsDragging(false);

    animateTo(targetIndex);
  }, [animateTo, applyPull, onRefresh, tabs.length]);

  // Tangani pembatalan gesture sentuh di tablet (misal gesture sistem Android back/home)
  // Menjamin layar tidak pernah stuck macet di tengah jalan
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

    if (isPullingRef.current) {
      isPullingRef.current = false;
      pullDistanceRef.current = 0;
      if (!isRefreshingRef.current) {
        setPullState('idle');
        applyPull(0, 'idle');
      }
      return;
    }

    const targetIdx = Math.max(0, Math.min(tabs.length - 1, Math.round(tRef.current)));
    animateTo(targetIdx);
  }, [animateTo, applyPull, tabs.length]);

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
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    progress,
    isDragging,
    isNavbarHolding,
    pullState,
    pullIndicatorRef,
    pullIconRef,
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

