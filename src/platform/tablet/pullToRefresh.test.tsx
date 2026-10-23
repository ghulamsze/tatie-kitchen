import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeNav } from './useSwipeNav.ts';
import { useMenuStore } from '../../stores/menuStore.ts';
import { broadcastMenuAvailability, broadcastOrderCreated } from '../../lib/supabase/realtime.ts';

describe('Navigasi Layar Tablet & Sinkronisasi Database Realtime', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('useSwipeNav Hook - Navigasi Layar Murni (Bebas Pull-to-Refresh)', () => {
    it('menginisialisasi progress sesuai activeTab dan mengekspos handler navigasi', () => {
      const onTabChange = vi.fn();

      const { result } = renderHook(() =>
        useSwipeNav({
          tabs: ['Home', 'Riwayat', 'Akun'],
          activeTab: 'Home',
          onTabChange,
        })
      );

      expect(result.current.progress).toBe(0);
      expect(result.current.isDragging).toBe(false);
      expect(result.current.containerRef).toBeDefined();
      expect(result.current.trackRef).toBeDefined();
    });

    it('mendukung scrollToTab langsung ke tab tujuan', () => {
      const onTabChange = vi.fn();

      const { result } = renderHook(() =>
        useSwipeNav({
          tabs: ['Home', 'Riwayat', 'Akun'],
          activeTab: 'Home',
          onTabChange,
        })
      );

      act(() => {
        result.current.scrollToTab('Riwayat');
      });

      expect(onTabChange).toHaveBeenCalledWith('Riwayat');
    });

    it('tidak menggeser tab jika menyentuh slider chip kategori horizontal', () => {
      const onTabChange = vi.fn();

      const { result } = renderHook(() =>
        useSwipeNav({
          tabs: ['Home', 'Riwayat', 'Akun'],
          activeTab: 'Home',
          onTabChange,
        })
      );

      const categoryBar = document.createElement('div');
      categoryBar.className = 'tk-category-nav tk-chips-bar';
      const chip = document.createElement('button');
      chip.className = 'tk-chip';
      categoryBar.appendChild(chip);

      act(() => {
        result.current.handlePagerPointerDown({
          target: chip,
          clientX: 200,
          clientY: 200,
          pointerId: 1,
          currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      act(() => {
        result.current.handlePagerPointerMove({
          clientX: 120, // dx = 80px horizontal
          clientY: 200,
          pointerId: 1,
          currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Layar tidak dalam mode isDragging karena pointer berada di slider chip kategori
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('useMenuStore & Realtime - Sinkronisasi Ketersediaan Menu Database', () => {
    it('mengubah status available item dan menyimpannya di state serta localStorage', async () => {
      const store = useMenuStore.getState();
      const firstItem = store.items[0];
      expect(firstItem.available).toBe(true);

      // Tandai item pertama habis (available = false)
      await act(async () => {
        await store.toggleItemAvailability(firstItem.id, false);
      });

      const updatedItem = useMenuStore.getState().items.find((i) => i.id === firstItem.id);
      expect(updatedItem?.available).toBe(false);

      // Pastikan tersimpan di localStorage (baik id maupun normalized name)
      const rawStored = localStorage.getItem('tk_item_availability');
      expect(rawStored).toBeTruthy();
      const parsed = JSON.parse(rawStored!);
      expect(parsed[firstItem.id]).toBe(false);
      expect(parsed[firstItem.name.trim().toLowerCase()]).toBe(false);

      // Kembalikan ke tersedia (available = true)
      await act(async () => {
        await store.toggleItemAvailability(firstItem.id, true);
      });

      const restoredItem = useMenuStore.getState().items.find((i) => i.id === firstItem.id);
      expect(restoredItem?.available).toBe(true);
    });

    it('mendukung broadcast ketersediaan dan pesanan ke perangkat lain', async () => {
      // Pastikan helper broadcast dapat dipanggil tanpa melempar error
      await expect(broadcastMenuAvailability('m-01', 'Mie Goreng Komplit', false)).resolves.not.toThrow();
      await expect(broadcastOrderCreated('ord-123', 5, 50000)).resolves.not.toThrow();
    });
  });
});
