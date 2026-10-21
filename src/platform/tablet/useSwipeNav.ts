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
  const pagerRef = useRef<HTMLDivElement | null>(null);
  const activeIndex = Math.max(0, tabs.indexOf(activeTab));
  const [scrollProgress, setScrollProgress] = useState<number>(activeIndex);

  const isProgrammaticScroll = useRef(false);
  const rafId = useRef<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update posisi pager saat activeTab berubah dari luar
  useEffect(() => {
    const pager = pagerRef.current;
    if (!pager) return;

    const targetIndex = Math.max(0, tabs.indexOf(activeTab));
    const targetScrollLeft = targetIndex * pager.clientWidth;

    // Jika posisi scroll sudah dekat dengan target, lewati
    if (Math.abs(pager.scrollLeft - targetScrollLeft) > 2) {
      isProgrammaticScroll.current = true;
      pager.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });

      // Lepas flag programmatic setelah smooth scroll selesai
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
        setScrollProgress(targetIndex);
      }, 350);
    }
  }, [activeTab, tabs]);

  // Listener scroll real-time dengan rAF
  const handleScroll = useCallback(() => {
    const pager = pagerRef.current;
    if (!pager || pager.clientWidth === 0) return;

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      const progress = pager.scrollLeft / pager.clientWidth;
      const clamped = Math.max(0, Math.min(tabs.length - 1, progress));
      setScrollProgress(clamped);

      // Sinkronkan tab aktif saat scroll selesai jika bukan programmatic scroll
      if (!isProgrammaticScroll.current) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          if (isProgrammaticScroll.current) return;
          const nearestIndex = Math.max(0, Math.min(tabs.length - 1, Math.round(progress)));
          const targetTab = tabs[nearestIndex];
          if (targetTab && targetTab !== activeTab) {
            onTabChange(targetTab);
          }
        }, 120);
      }
    });
  }, [tabs, activeTab, onTabChange]);

  // Scroll ke tab saat tombol navbar diklik
  const scrollToTab = useCallback((tab: NavItem) => {
    const pager = pagerRef.current;
    if (!pager) {
      onTabChange(tab);
      return;
    }

    const idx = Math.max(0, tabs.indexOf(tab));
    isProgrammaticScroll.current = true;
    pager.scrollTo({
      left: idx * pager.clientWidth,
      behavior: 'smooth',
    });

    setScrollProgress(idx);
    onTabChange(tab);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 350);
  }, [tabs, onTabChange]);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    pagerRef,
    scrollProgress,
    handleScroll,
    scrollToTab,
  };
}
