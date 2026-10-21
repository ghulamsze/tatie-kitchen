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
import { Sheet } from '../../design/components/Sheet.tsx';
import { Button } from '../../design/components/Button.tsx';
import { SwipePager } from './SwipePager.tsx';
import { useSwipeNav } from './useSwipeNav.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { useMenuStore } from '../../stores/menuStore.ts';
import { Cashier } from '../../lib/supabase/types.ts';

export type TabletScreen = 'intro' | 'select-cashier' | 'payment' | 'receipt' | NavItem;

const NAV_TABS: NavItem[] = ['Home', 'Riwayat', 'Akun'];

export const TabletRoot: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<TabletScreen>('intro');
  const [isDeviceSetupOpen, setIsDeviceSetupOpen] = useState(false);
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
  const { activeCashier } = useCashierStore();
  const { heldItem, setHeldItem, toggleItemAvailability } = useMenuStore();

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

  const {
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

  // 5. Layar Utama Tablet (Home, Riwayat, Akun) dengan Seamless Drag-to-Switch
  const showNavbar = currentScreen === 'Home' || currentScreen === 'Riwayat' || currentScreen === 'Akun';
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
        <div
          className="tk-global-bg-bubbles"
          style={{
            position: 'absolute',
            inset: '-12%',
            background: `
              radial-gradient(circle at calc(14% + var(--bg-t, 0) * 18%) calc(10% + var(--bg-t, 0) * 8%), var(--b1) 0, transparent 26%),
              radial-gradient(ellipse at calc(55% - var(--bg-t, 0) * 12%) calc(92% - var(--bg-t, 0) * 6%), var(--b2) 0, transparent 55%),
              radial-gradient(ellipse at calc(95% - var(--bg-t, 0) * 16%) calc(78% - var(--bg-t, 0) * 12%), var(--b3) 0, transparent 42%)
            `,
            filter: 'blur(26px)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Horizontal Swipeable Container berbasis transform translate3d (Home, Riwayat, Akun) */}
      <SwipePager
        trackRef={trackRef}
        progress={progress}
        isDragging={isDragging}
        onPointerDown={handlePagerPointerDown}
        onPointerMove={handlePagerPointerMove}
        onPointerUp={handlePagerPointerUp}
      >
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

      {/* Navbar Pil Melayang di Bagian Bawah Layar Tablet dengan Single Progress Value t */}
      {showNavbar && (
        <NavbarPill
          activeItem={activeNavTab}
          onSelect={scrollToTab}
          progress={progress}
          isDragging={isDragging}
          navRef={navbarRef}
          indicatorRef={indicatorRef}
          onPointerDown={handleNavbarPointerDown}
          onPointerMove={handleNavbarPointerMove}
          onPointerUp={handleNavbarPointerUp}
          isBlocked={isModalActive}
        />
      )}

      {/* Sheet Ubah Status Menu di Level Root agar Navbar Tertutup Blur & Terblokir */}
      <Sheet
        isOpen={Boolean(heldItem)}
        onClose={() => setHeldItem(null)}
        title={heldItem ? `Ubah status: ${heldItem.name}` : ''}
      >
        {heldItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <p style={{ margin: 0, fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
              Status saat ini:{' '}
              <b style={{ color: heldItem.available ? 'var(--accent-ink)' : 'var(--danger)' }}>
                {heldItem.available ? 'Tersedia' : 'Habis'}
              </b>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="flat" size="md" onClick={() => setHeldItem(null)}>
                Batal
              </Button>
              <Button
                variant={heldItem.available ? 'danger' : 'lime'}
                size="md"
                onClick={() => toggleItemAvailability(heldItem.id, !heldItem.available)}
              >
                {heldItem.available ? 'Tandai habis' : 'Tandai tersedia'}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};
