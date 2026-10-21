import React, { useState } from 'react';
import { IntroScreen } from '../../features/intro/IntroScreen.tsx';
import { SelectCashierScreen } from '../../features/profil/SelectCashierScreen.tsx';
import { AccountScreen } from '../../features/akun/AccountScreen.tsx';
import { DeviceSetupModal } from '../../features/auth/DeviceSetupModal.tsx';
import { NavbarPill, NavItem } from '../../design/components/NavbarPill.tsx';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { Cashier } from '../../lib/supabase/types.ts';

export type TabletScreen = 'intro' | 'select-cashier' | NavItem;

export const TabletRoot: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<TabletScreen>('intro');
  const [isDeviceSetupOpen, setIsDeviceSetupOpen] = useState(false);
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

  // 3. Layar Utama Tablet (Home, Riwayat, Akun) dengan Navbar Pil
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
        <div
          className="scr"
          style={{
            width: '1024px',
            height: '640px',
            padding: '24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '56px' }}>
            <h2 style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', margin: 0, fontWeight: 800 }}>
              Tati’e Kitchen
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                className="ctl-flat"
                style={{
                  height: '48px',
                  padding: '0 20px',
                  borderRadius: 'var(--r-md)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 'var(--t-sm)',
                  fontWeight: 700,
                }}
              >
                Kasir: {activeCashier?.name || 'Robertus Amaresi'}
              </div>
            </div>
          </div>
          <div
            className="g-acrylic"
            style={{
              margin: 'auto',
              padding: '40px',
              textAlign: 'center',
              maxWidth: '560px',
            }}
          >
            <h3 style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800, margin: '0 0 12px' }}>
              Layar Home Kasir (Fase 5)
            </h3>
            <p style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', margin: 0 }}>
              Katalog kartu menu masonry, Golden Triangle menu lengkap pembeli, keranjang pesanan, dan perhitungan transaksi server-side akan aktif penuh pada Fase 5.
            </p>
          </div>
        </div>
      )}

      {currentScreen === 'Riwayat' && (
        <div
          className="scr"
          style={{
            width: '1024px',
            height: '640px',
            padding: '24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '56px' }}>
            <h2 style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', margin: 0, fontWeight: 800 }}>
              Riwayat Transaksi
            </h2>
          </div>
          <div
            className="g-acrylic"
            style={{
              margin: 'auto',
              padding: '40px',
              textAlign: 'center',
              maxWidth: '560px',
            }}
          >
            <h3 style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800, margin: '0 0 12px' }}>
              Layar Riwayat & Filter Rentang Waktu (Fase 5)
            </h3>
            <p style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)', margin: 0 }}>
              Daftar transaksi harian, rincian meja, cetak struk ulang, dan sheet filter rentang waktu akan aktif penuh pada Fase 5.
            </p>
          </div>
        </div>
      )}

      {/* Navbar Pil Melayang di Bagian Bawah Layar Tablet */}
      <NavbarPill
        activeItem={currentScreen as NavItem}
        onSelect={(item) => setCurrentScreen(item)}
      />
    </div>
  );
};
