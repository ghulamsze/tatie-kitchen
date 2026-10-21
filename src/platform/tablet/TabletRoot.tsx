import React, { useState } from 'react';
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
import { Cashier } from '../../lib/supabase/types.ts';

export type TabletScreen = 'intro' | 'select-cashier' | 'payment' | 'receipt' | NavItem;

const NAV_TABS: NavItem[] = ['Home', 'Riwayat', 'Akun'];

export const TabletRoot: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<TabletScreen>('intro');
  const [isDeviceSetupOpen, setIsDeviceSetupOpen] = useState(false);
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
  const { activeCashier } = useCashierStore();

  const activeNavTab: NavItem =
    currentScreen === 'Riwayat' || currentScreen === 'Akun' ? currentScreen : 'Home';

  const handleNavTabChange = (tab: NavItem) => {
    setCurrentScreen((prev) => {
      if (prev === 'Home' || prev === 'Riwayat' || prev === 'Akun') {
        return tab;
      }
      return prev;
    });
  };

  const { pagerRef, scrollProgress, handleScroll, scrollToTab } = useSwipeNav({
    tabs: NAV_TABS,
    activeTab: activeNavTab,
    onTabChange: handleNavTabChange,
  });

  const handleIntroFinish = () => {
    // Jika belum ada kasir aktif, arahkan ke pilih kasir
    if (!activeCashier) {
      setCurrentScreen('select-cashier');
    } else {
      setCurrentScreen('Home');
    }
  };

  const handleSelectCashier = (_cashier: Cashier) => {
    setCurrentScreen('Home');
  };

  const handleChangeCashier = () => {
    setCurrentScreen('select-cashier');
  };

  // 1. Layar Intro
  if (currentScreen === 'intro') {
    return <IntroScreen onFinish={handleIntroFinish} />;
  }

  // 2. Layar Pilih Profil Kasir
  if (currentScreen === 'select-cashier') {
    return (
      <>
        <SelectCashierScreen
          onSelectCashier={handleSelectCashier}
          onOpenDeviceSetup={() => setIsDeviceSetupOpen(true)}
        />
        <DeviceSetupModal
          isOpen={isDeviceSetupOpen}
          onClose={() => setIsDeviceSetupOpen(false)}
        />
      </>
    );
  }

  // 3. Layar Bayar Tunai & Keypad Meja
  if (currentScreen === 'payment') {
    return (
      <PaymentScreen
        onSuccess={() => setCurrentScreen('receipt')}
        onCancel={() => setCurrentScreen('Home')}
      />
    );
  }

  // 4. Layar Struk & Bukti Bayar
  if (currentScreen === 'receipt') {
    return (
      <ReceiptScreen
        onNewOrder={() => setCurrentScreen('Home')}
      />
    );
  }

  // 5. Layar Utama Tablet (Home, Riwayat, Akun) dengan Swipeable Pages Gesture Safari iOS
  const showNavbar = currentScreen === 'Home' || currentScreen === 'Riwayat' || currentScreen === 'Akun';

  return (
    <div
      style={{
        width: '1024px',
        height: '640px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--scr-bg)',
      }}
    >
      {/* Horizontal Swipeable Container dengan CSS Scroll-Snap (Home, Riwayat, Akun) */}
      <SwipePager pagerRef={pagerRef} onScroll={handleScroll}>
        <HomeScreen
          onOpenCustomerMenu={() => setIsCustomerMenuOpen(true)}
          onProceedToPayment={() => setCurrentScreen('payment')}
          onChangeCashier={handleChangeCashier}
        />
        <HistoryScreen />
        <AccountScreen onChangeCashier={handleChangeCashier} />
      </SwipePager>

      {/* Overlay Menu Lengkap Pembeli (Golden Triangle) */}
      {isCustomerMenuOpen && (
        <CustomerMenuView onClose={() => setIsCustomerMenuOpen(false)} />
      )}

      {/* Navbar Pil Melayang di Bagian Bawah Layar Tablet dengan Indikator Real-time */}
      {showNavbar && (
        <NavbarPill
          activeItem={activeNavTab}
          onSelect={(item) => scrollToTab(item)}
          scrollProgress={scrollProgress}
        />
      )}
    </div>
  );
};
