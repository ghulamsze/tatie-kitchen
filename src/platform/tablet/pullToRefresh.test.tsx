import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeNav } from './useSwipeNav.ts';
import { useMenuStore } from '../../stores/menuStore.ts';

describe('Pull to Refresh & Ketersediaan Menu', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('useSwipeNav Hook - Pull to Refresh', () => {
    it('menginisialisasi pullState dengan nilai idle dan mengekspos ref terkait', () => {
      const onTabChange = vi.fn();
      const onRefresh = vi.fn();

      const { result } = renderHook(() =>
        useSwipeNav({
          tabs: ['Home', 'Riwayat', 'Akun'],
          activeTab: 'Home',
          onTabChange,
          onRefresh,
        })
      );

      expect(result.current.pullState).toBe('idle');
      expect(result.current.pullIndicatorRef).toBeDefined();
      expect(result.current.pullIconRef).toBeDefined();
      expect(result.current.pullTextRef).toBeDefined();
    });

    it('mendeteksi tarikan ke bawah dan memicu callback onRefresh jika melewati ambang batas', async () => {
      const onTabChange = vi.fn();
      const onRefresh = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useSwipeNav({
          tabs: ['Home', 'Riwayat', 'Akun'],
          activeTab: 'Home',
          onTabChange,
          onRefresh,
        })
      );

      // Simulasikan pointer down di area konten
      const mockTarget = document.createElement('div');
      const downEvent = {
        target: mockTarget,
        clientX: 200,
        clientY: 50,
        pointerId: 1,
        currentTarget: {
          setPointerCapture: vi.fn(),
          releasePointerCapture: vi.fn(),
        },
      } as unknown as React.PointerEvent<HTMLDivElement>;

      act(() => {
        result.current.handlePagerPointerDown(downEvent);
      });

      // Simulasikan pointer move ditarik ke bawah sebesar 100px (melewati ambang batas)
      const moveEvent = {
        clientX: 202,
        clientY: 170, // dy = 120px
        pointerId: 1,
        currentTarget: {
          setPointerCapture: vi.fn(),
          releasePointerCapture: vi.fn(),
        },
      } as unknown as React.PointerEvent<HTMLDivElement>;

      act(() => {
        result.current.handlePagerPointerMove(moveEvent);
      });

      expect(result.current.pullState).toBe('pulling');

      // Simulasikan pointer dilepas (pointer up)
      const upEvent = {
        clientX: 202,
        clientY: 170,
        pointerId: 1,
        currentTarget: {
          setPointerCapture: vi.fn(),
          releasePointerCapture: vi.fn(),
        },
      } as unknown as React.PointerEvent<HTMLDivElement>;

      await act(async () => {
        result.current.handlePagerPointerUp(upEvent);
      });

      // Memastikan onRefresh berhasil dipanggil
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  describe('useMenuStore - Status Ketersediaan Makanan Habis', () => {
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

      // Pastikan tersimpan di localStorage
      const rawStored = localStorage.getItem('tk_item_availability');
      expect(rawStored).toBeTruthy();
      const parsed = JSON.parse(rawStored!);
      expect(parsed[firstItem.id]).toBe(false);

      // Kembalikan ke tersedia (available = true)
      await act(async () => {
        await store.toggleItemAvailability(firstItem.id, true);
      });

      const restoredItem = useMenuStore.getState().items.find((i) => i.id === firstItem.id);
      expect(restoredItem?.available).toBe(true);
    });
  });
});
