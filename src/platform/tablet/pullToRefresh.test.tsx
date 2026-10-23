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
    });

    it('tidak terpicu jika gerakan kecil atau tidak disengaja', () => {
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

      const mockTarget = document.createElement('div');
      act(() => {
        result.current.handlePagerPointerDown({
          target: mockTarget,
          clientX: 200,
          clientY: 50,
          pointerId: 1,
          currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Gerakan kecil hanya 12px ke bawah
      act(() => {
        result.current.handlePagerPointerMove({
          clientX: 201,
          clientY: 62,
          pointerId: 1,
          currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      expect(result.current.pullState).toBe('idle');
    });

    it('mendeteksi tarikan ke bawah yang mantap dan memicu callback onRefresh', async () => {
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

      // Simulasikan pointer down di area header non-interaktif
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

      // Simulasikan pointer move ditarik ke bawah secara mantap sebesar 150px
      const moveEvent = {
        clientX: 201,
        clientY: 200, // dy = 150px lurus ke bawah
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
        clientX: 201,
        clientY: 200,
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

    it('tidak memicu onRefresh jika tarikan belum mencapai ujung (kurang dari threshold)', async () => {
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

      const mockTarget = document.createElement('div');
      act(() => {
        result.current.handlePagerPointerDown({
          target: mockTarget,
          clientX: 200,
          clientY: 50,
          pointerId: 1,
          currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Tarik hanya 50px (belum mentok di ujung)
      act(() => {
        result.current.handlePagerPointerMove({
          clientX: 200,
          clientY: 100, // dy = 50px
          pointerId: 1,
          currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      await act(async () => {
        result.current.handlePagerPointerUp({
          clientX: 200,
          clientY: 100,
          pointerId: 1,
          currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Tidak boleh refresh karena belum di ujung!
      expect(onRefresh).not.toHaveBeenCalled();
      expect(result.current.pullState).toBe('idle');
    });

    it('tidak mengaktifkan pull to refresh jika sentuhan dimulai di dalam kartu menu atau grid menu', () => {
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

      const menuGrid = document.createElement('div');
      menuGrid.className = 'tk-menu-grid';
      const menuCard = document.createElement('div');
      menuCard.className = 'tk-menu-card';
      menuGrid.appendChild(menuCard);

      act(() => {
        result.current.handlePagerPointerDown({
          target: menuCard,
          clientX: 200,
          clientY: 200,
          pointerId: 1,
          currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      act(() => {
        result.current.handlePagerPointerMove({
          clientX: 200,
          clientY: 350, // dy = 150px
          pointerId: 1,
          currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Di dalam kartu menu, tidak boleh masuk mode pulling
      expect(result.current.pullState).toBe('idle');
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

    it('mempertahankan status habis saat fetchMenu dipanggil (anti-revert bug)', async () => {
      const store = useMenuStore.getState();
      const secondItem = store.items[1];

      // Tandai habis
      await act(async () => {
        await store.toggleItemAvailability(secondItem.id, false);
      });

      expect(useMenuStore.getState().items.find((i) => i.id === secondItem.id)?.available).toBe(false);

      // Simulasikan fetchMenu (misalnya saat refresh layar)
      await act(async () => {
        await store.fetchMenu();
      });

      // Menu tetap harus habis (false), tidak boleh tiba-tiba kembali tersedia (true)
      const itemAfterFetch = useMenuStore.getState().items.find((i) => i.id === secondItem.id);
      expect(itemAfterFetch?.available).toBe(false);
    });
  });
});

