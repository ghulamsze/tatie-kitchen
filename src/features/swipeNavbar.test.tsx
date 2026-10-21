import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { NavbarPill, NavItem } from '../design/components/NavbarPill.tsx';
import { useSwipeNav } from '../platform/tablet/useSwipeNav.ts';
import { SwipePager } from '../platform/tablet/SwipePager.tsx';

describe('Swipe Navigation & Navbar Pill Tests', () => {
  describe('NavbarPill Component', () => {
    it('harus merender semua tab dengan tab aktif yang ditandai aria-current', () => {
      const handleSelect = vi.fn();
      render(<NavbarPill activeItem="Riwayat" onSelect={handleSelect} />);

      const homeBtn = screen.getByRole('button', { name: 'Home' });
      const riwayatBtn = screen.getByRole('button', { name: 'Riwayat' });
      const akunBtn = screen.getByRole('button', { name: 'Akun' });

      expect(homeBtn).toBeInTheDocument();
      expect(riwayatBtn).toBeInTheDocument();
      expect(akunBtn).toBeInTheDocument();

      expect(riwayatBtn).toHaveAttribute('aria-current', 'page');
      expect(homeBtn).not.toHaveAttribute('aria-current');
      expect(akunBtn).not.toHaveAttribute('aria-current');
    });

    it('harus memanggil onSelect saat tombol tab diklik langsung', () => {
      const handleSelect = vi.fn();
      render(<NavbarPill activeItem="Home" onSelect={handleSelect} />);

      const akunBtn = screen.getByRole('button', { name: 'Akun' });
      fireEvent.click(akunBtn);
      expect(handleSelect).toHaveBeenCalledWith('Akun');
    });

    it('harus snap tepat pada tab target saat transitionend dipicu', () => {
      const indicatorRef = React.createRef<HTMLDivElement>();
      render(
        <NavbarPill
          activeItem="Riwayat"
          onSelect={() => {}}
          indicatorRef={indicatorRef}
        />
      );

      const indicator = indicatorRef.current;
      expect(indicator).toBeTruthy();

      // Trigger transitionend
      if (indicator) {
        fireEvent.transitionEnd(indicator);
        expect(indicator.style.transition).toBe('none');
      }
    });

    it('tidak merespons klik saat isBlocked=true', () => {
      const handleSelect = vi.fn();
      render(<NavbarPill activeItem="Home" onSelect={handleSelect} isBlocked={true} />);

      const riwayatBtn = screen.getByRole('button', { name: 'Riwayat' });
      expect(riwayatBtn).toBeDisabled();
      fireEvent.click(riwayatBtn);
      expect(handleSelect).not.toHaveBeenCalled();
    });
  });

  describe('useSwipeNav Hook & SwipePager Logic', () => {
    const tabs: NavItem[] = ['Home', 'Riwayat', 'Akun'];

    it('harus menginisialisasi pada tab aktif', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNav({
          tabs,
          activeTab: 'Home',
          onTabChange,
        })
      );

      expect(result.current.progress).toBe(0);
      expect(result.current.isDragging).toBe(false);
    });

    it('10px dead zone: pergerakan kecil (<=10px) tidak boleh memulai drag', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNav({
          tabs,
          activeTab: 'Home',
          onTabChange,
        })
      );

      const dummyElement = document.createElement('div');

      act(() => {
        result.current.handlePagerPointerDown({
          clientX: 100,
          clientY: 100,
          target: dummyElement,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Gerak 5px (di bawah 10px dead zone)
      act(() => {
        result.current.handlePagerPointerMove({
          clientX: 105,
          clientY: 100,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('vertical scroll lockout: gerakan vertikal (|dy| > |dx|) mengunci horizontal swipe', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNav({
          tabs,
          activeTab: 'Home',
          onTabChange,
        })
      );

      const dummyElement = document.createElement('div');

      act(() => {
        result.current.handlePagerPointerDown({
          clientX: 100,
          clientY: 100,
          target: dummyElement,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Gerak vertikal 25px, horizontal 5px (|dy| > |dx|)
      act(() => {
        result.current.handlePagerPointerMove({
          clientX: 105,
          clientY: 125,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('long swipe (>40% / min 120px): swipe kiri berhasil berpindah ke halaman berikutnya', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNav({
          tabs,
          activeTab: 'Home',
          onTabChange,
        })
      );

      const dummyElement = document.createElement('div');

      act(() => {
        result.current.handlePagerPointerDown({
          clientX: 500,
          clientY: 100,
          target: dummyElement,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Geser 150px ke kiri (dx = -150)
      act(() => {
        result.current.handlePagerPointerMove({
          clientX: 350,
          clientY: 100,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      expect(result.current.isDragging).toBe(true);

      // Lepaskan pointer
      act(() => {
        result.current.handlePagerPointerUp({
          clientX: 350,
          clientY: 100,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Berpindah dari Home (0) ke Riwayat (1)
      expect(onTabChange).toHaveBeenCalledWith('Riwayat');
      expect(result.current.isDragging).toBe(false);
    });

    it('snap back: jika drag tidak memenuhi kriteria flick atau 40%, kembali ke halaman awal', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNav({
          tabs,
          activeTab: 'Home',
          onTabChange,
        })
      );

      const dummyElement = document.createElement('div');

      act(() => {
        result.current.handlePagerPointerDown({
          clientX: 500,
          clientY: 100,
          target: dummyElement,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Geser 30px lambat (tidak flick dan < 120px)
      act(() => {
        result.current.handlePagerPointerMove({
          clientX: 470,
          clientY: 100,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      act(() => {
        result.current.handlePagerPointerUp({
          clientX: 470,
          clientY: 100,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Tetap di Home (snap back)
      expect(onTabChange).toHaveBeenCalledWith('Home');
    });

    it('meredam event click setelah drag selesai agar tombol tidak terpicu', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNav({
          tabs,
          activeTab: 'Home',
          onTabChange,
        })
      );

      const dummyElement = document.createElement('div');

      act(() => {
        result.current.handlePagerPointerDown({
          clientX: 500,
          clientY: 100,
          target: dummyElement,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      act(() => {
        result.current.handlePagerPointerMove({
          clientX: 300,
          clientY: 100,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      act(() => {
        result.current.handlePagerPointerUp({
          clientX: 300,
          clientY: 100,
          currentTarget: dummyElement,
          pointerId: 1,
        } as unknown as React.PointerEvent<HTMLDivElement>);
      });

      // Dispatch event click palsu pada window
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const defaultPrevented = !window.dispatchEvent(clickEvent);

      // Event click harus dicegah (preventDefault) oleh click suppression handler
      expect(defaultPrevented).toBe(true);
    });
  });

  describe('SwipePager Component', () => {
    it('harus merender container dengan touchAction pan-y dan children', () => {
      render(
        <SwipePager progress={0} isDragging={false}>
          <div data-testid="page-1">Halaman 1</div>
          <div data-testid="page-2">Halaman 2</div>
        </SwipePager>
      );

      expect(screen.getByTestId('page-1')).toBeInTheDocument();
      expect(screen.getByTestId('page-2')).toBeInTheDocument();

      const container = screen.getByLabelText('Swipeable tab pages');
      expect(container.style.touchAction).toBe('pan-y');
    });
  });
});
