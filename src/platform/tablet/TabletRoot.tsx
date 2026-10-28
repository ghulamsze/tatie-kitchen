import React, { useState, useEffect } from 'react';
import { IntroScreen } from '../../features/intro/IntroScreen.tsx';
import { SelectCashierScreen } from '../../features/profil/SelectCashierScreen.tsx';
import { AccountScreen } from '../../features/akun/AccountScreen.tsx';
import { DeviceSetupModal } from '../../features/auth/DeviceSetupModal.tsx';
import { HomeScreen } from '../../features/home/HomeScreen.tsx';
import { CustomerMenuView } from '../../features/menu-lengkap/CustomerMenuView.tsx';
import { PaymentScreen } from '../../features/bayar/PaymentScreen.tsx';
import { ReceiptScreen } from '../../features/struk/ReceiptScreen.tsx';
import { HistoryScreen } from '../../features/riwayat/HistoryScreen.tsx';
import { NavbarPill, NavItem } from '../../design/components/NavbarPill.tsx';
import { SwipePager } from './SwipePager.tsx';
import { useSwipeNav } from './useSwipeNav.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { useMenuStore } from '../../stores/menuStore.ts';
import { Cashier } from '../../lib/supabase/types.ts';
import { useNetworkStatus } from './useNetworkStatus.ts';
import { NoInternetNotice } from '../../design/components/NoInternetNotice.tsx';
import { initPosRealtimeSync } from '../../lib/supabase/realtime.ts';
import { DynamicBackground } from '../../design/dynamicBg/index.ts';
import { MenuDetailModal } from '../../features/menu/MenuDetailModal.tsx';

export type TabletScreen = 'intro' | 'select-cashier' | 'payment' | 'receipt' | NavItem;

const NAV_TABS: NavItem[] = ['Beranda', 'Riwayat', 'Akun'];

export const TabletRoot: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<TabletScreen>('intro');
  const [isDeviceSetupOpen, setIsDeviceSetupOpen] = useState(false);
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
  const { activeCashier } = useCashierStore();
  const { heldItem, setHeldItem } = useMenuStore();
  const { isOnline } = useNetworkStatus();

  const activeNavTab: NavItem =
    currentScreen === 'Riwayat' || currentScreen === 'Akun' ? currentScreen : 'Beranda';

  // Sinkronisasi real-time dua arah berbasis database Supabase (Broadcast + Polling Cepat + Focus auto-refresh)
  useEffect(() => {
    const cleanupRealtime = initPosRealtimeSync();
    useCashierStore.getState().fetchCashiers().catch(() => {});
    return () => {
      cleanupRealtime();
    };
  }, []);

  const handleNavTabChange = (tab: NavItem) => {
    setCurrentScreen((prev) => {
      if (prev === 'Beranda' || prev === 'Riwayat' || prev === 'Akun') {
        return tab;
      }
      return prev;
    });
  };

  const {
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
  } = useSwipeNav({
    tabs: NAV_TABS,
    activeTab: activeNavTab,
    onTabChange: handleNavTabChange,
  });

  const handleIntroFinish = () => {
    // Jika belum ada kasir aktif, arahkan ke pilih kasir
    if (!activeCashier) {
      setCurrentScreen('select-cashier');
    } else {
      setCurrentScreen('Beranda');
    }
  };

  const handleSelectCashier = (_cashier: Cashier) => {
    setCurrentScreen('Beranda');
  };

  const handleChangeCashier = () => {
    setCurrentScreen('select-cashier');
  };

  const renderOfflineBanner = () => {
    if (isOnline) return null;
    return (
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 990,
          pointerEvents: 'auto',
        }}
      >
        <NoInternetNotice variant="banner" />
      </div>
    );
  };

  // 1. Layar Intro
  if (currentScreen === 'intro') {
    return (
      <div style={{ width: '1024px', height: '640px', position: 'relative', overflow: 'hidden' }}>
        {renderOfflineBanner()}
        <IntroScreen onFinish={handleIntroFinish} />
      </div>
    );
  }

  // 2. Layar Pilih Profil Kasir
  if (currentScreen === 'select-cashier') {
    return (
      <div style={{ width: '1024px', height: '640px', position: 'relative', overflow: 'hidden' }}>
        {renderOfflineBanner()}
        <SelectCashierScreen
          onSelectCashier={handleSelectCashier}
          onOpenDeviceSetup={() => setIsDeviceSetupOpen(true)}
        />
        <DeviceSetupModal
          isOpen={isDeviceSetupOpen}
          onClose={() => setIsDeviceSetupOpen(false)}
        />
      </div>
    );
  }

  // 3. Layar Bayar Tunai & Keypad Meja
  if (currentScreen === 'payment') {
    return (
      <div style={{ width: '1024px', height: '640px', position: 'relative', overflow: 'hidden' }}>
        {renderOfflineBanner()}
        <PaymentScreen
          onSuccess={() => setCurrentScreen('receipt')}
          onCancel={() => setCurrentScreen('Beranda')}
        />
      </div>
    );
  }

  // 4. Layar Struk & Bukti Bayar
  if (currentScreen === 'receipt') {
    return (
      <div style={{ width: '1024px', height: '640px', position: 'relative', overflow: 'hidden' }}>
        {renderOfflineBanner()}
        <ReceiptScreen
          onNewOrder={() => setCurrentScreen('Beranda')}
        />
      </div>
    );
  }

  // 5. Layar Utama Tablet (Beranda, Riwayat, Akun) dengan Seamless Drag-to-Switch
  const showNavbar = (currentScreen === 'Beranda' || currentScreen === 'Riwayat' || currentScreen === 'Akun') && !isCustomerMenuOpen;
  const isModalActive = Boolean(heldItem) || isCustomerMenuOpen;

  return (
    <div
      ref={containerRef}
      className="tk-tablet-root"
      style={{
        width: '1024px',
        height: '640px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--scr-bg)',
      }}
    >
      {renderOfflineBanner()}
      {/* Seamless Global Dynamic Background: di luar container sliding, z-index paling bawah, tidak pernah terpotong */}
      <div
        className="tk-global-bg"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          background: 'var(--scr-bg)',
        }}
      >
        <DynamicBackground />
      </div>


      {/* Horizontal Swipeable Container berbasis transform translate3d (Home, Riwayat, Akun) */}
      <SwipePager
        trackRef={trackRef}
        progress={progress}
        isDragging={isDragging}
        onPointerDown={handlePagerPointerDown}
        onPointerMove={handlePagerPointerMove}
        onPointerUp={handlePagerPointerUp}
        onPointerCancel={handlePagerPointerCancel}
      >
        <HomeScreen
          onOpenCustomerMenu={() => setIsCustomerMenuOpen(true)}
          onProceedToPayment={() => setCurrentScreen('payment')}
          onChangeCashier={handleChangeCashier}
        />
        <HistoryScreen />
        <AccountScreen onChangeCashier={handleChangeCashier} />
      </SwipePager>

      {/* Navbar Pil Melayang di Bagian Bawah Layar Tablet dengan Single Progress Value t */}
      {showNavbar && (
        <NavbarPill
          activeItem={activeNavTab}
          onSelect={scrollToTab}
          progress={progress}
          isDragging={isDragging}
          isHolding={isNavbarHolding}
          navRef={navbarRef}
          indicatorRef={indicatorRef}
          onPointerDown={handleNavbarPointerDown}
          onPointerMove={handleNavbarPointerMove}
          onPointerUp={handleNavbarPointerUp}
          onPointerCancel={handleNavbarPointerCancel}
          isBlocked={isModalActive}
        />
      )}

      {/* Overlay Menu Lengkap Pembeli (Golden Triangle) */}
      {isCustomerMenuOpen && (
        <CustomerMenuView onClose={() => setIsCustomerMenuOpen(false)} />
      )}

      {/* Portal Container untuk Dialog & Sheet agar overlay menutupi Navbar */}
      <div id="tk-portal-root" style={{ position: 'absolute', inset: 0, zIndex: 120, pointerEvents: 'none' }} />

      {/* Modal Detail Menu Otomatis saat Hold Menu di Kasir Tablet */}
      <MenuDetailModal
        item={heldItem}
        isOpen={Boolean(heldItem)}
        onClose={() => setHeldItem(null)}
      />
    </div>
  );
};
