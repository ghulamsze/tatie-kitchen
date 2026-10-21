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
import { useCashierStore } from '../../stores/cashierStore.ts';
import { Cashier } from '../../lib/supabase/types.ts';

export type TabletScreen = 'intro' | 'select-cashier' | 'payment' | 'receipt' | NavItem;

export const TabletRoot: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<TabletScreen>('intro');
  const [isDeviceSetupOpen, setIsDeviceSetupOpen] = useState(false);
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
  const { activeCashier } = useCashierStore();

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

  // 5. Layar Utama Tablet (Home, Riwayat, Akun) dengan Navbar Pil Melayang
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
      {/* Konten Berdasarkan Tab Aktif */}
      {currentScreen === 'Akun' && (
        <AccountScreen onChangeCashier={handleChangeCashier} />
      )}

      {currentScreen === 'Home' && (
        <HomeScreen
          onOpenCustomerMenu={() => setIsCustomerMenuOpen(true)}
          onProceedToPayment={() => setCurrentScreen('payment')}
          onChangeCashier={handleChangeCashier}
        />
      )}

      {currentScreen === 'Riwayat' && (
        <HistoryScreen />
      )}

      {/* Overlay Menu Lengkap Pembeli (Golden Triangle) */}
      {isCustomerMenuOpen && (
        <CustomerMenuView onClose={() => setIsCustomerMenuOpen(false)} />
      )}

      {/* Navbar Pil Melayang di Bagian Bawah Layar Tablet */}
      {showNavbar && (
        <NavbarPill
          activeItem={currentScreen as NavItem}
          onSelect={(item) => setCurrentScreen(item)}
        />
      )}
    </div>
  );
};
