import React, { useState, useEffect } from 'react';
import { NavItem, NavbarPill } from '../../design/components/NavbarPill.tsx';
import { IntroScreen } from '../../features/intro/IntroScreen.tsx';
import { PhoneHomeScreen } from './screens/PhoneHomeScreen.tsx';
import { PhoneMenuScreen } from './screens/PhoneMenuScreen.tsx';
import { PhoneHistoryScreen } from './screens/PhoneHistoryScreen.tsx';
import { PhoneOrderDetailScreen } from './screens/PhoneOrderDetailScreen.tsx';
import { PhoneAccountScreen } from './screens/PhoneAccountScreen.tsx';
import { PhoneSalesReportScreen } from './screens/PhoneSalesReportScreen.tsx';
import { PhonePrintMenuPreview } from './components/PhonePrintMenuPreview.tsx';
import { initPosRealtimeSync } from '../../lib/supabase/realtime.ts';
import { DynamicBackground } from '../../design/dynamicBg/index.ts';
import { registerBackHandler } from '../../lib/device/backButton.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { useHistoryStore } from '../../stores/historyStore.ts';
import { useMenuStore } from '../../stores/menuStore.ts';
import { SwipePager } from '../tablet/SwipePager.tsx';
import { usePhoneSwipeNav } from './usePhoneSwipeNav.ts';
import { useDevice } from '../../lib/device/useDevice.ts';
import { Toast } from '../../design/components/Toast.tsx';

const PHONE_NAV_TABS: NavItem[] = ['Beranda', 'Menu', 'Akun'];

export const PhoneRoot: React.FC = () => {
  const device = useDevice();
  const isSwipeEnabled = device.platform === 'ios';
  const toastMessage = useMenuStore((state) => state.toastMessage);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavItem>('Beranda');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState<boolean>(false);
  const [isAllHistoryOpen, setIsAllHistoryOpen] = useState<boolean>(false);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState<boolean>(false);

  const {
    progress,
    isDragging,
    containerRef,
    trackRef,
    indicatorRef,
    navbarRef,
    handlePagerPointerDown,
    handlePagerPointerMove,
    handlePagerPointerUp,
    handlePagerPointerCancel,
    scrollToTab,
  } = usePhoneSwipeNav({
    tabs: PHONE_NAV_TABS,
    activeTab,
    onTabChange: (tab) => setActiveTab(tab),
    isSwipeEnabled,
  });

  // Sinkronisasi real-time dua arah berbasis database Supabase di perangkat HP
  useEffect(() => {
    const cleanup = initPosRealtimeSync();
    useCashierStore.getState().fetchCashiers().catch(() => {});
    useMenuStore.getState().fetchMenu().catch(() => {});
    return () => {
      cleanup();
    };
  }, []);

  const isModalOrOverlayActive = Boolean(
    selectedOrderId || isPrintMenuOpen || isAllHistoryOpen || isSalesReportOpen
  );

  // Tangani tombol back default Android agar tidak menutup aplikasi
  useEffect(() => {
    return registerBackHandler(() => {
      // 1. Jika ada overlay rincian pesanan terbuka, tutup rincian dan kembali ke layar sebelumnya
      if (selectedOrderId) {
        setSelectedOrderId(null);
        useHistoryStore.getState().setSelectedOrder(null);
        return true;
      }
      // 2. Jika ada preview cetak menu terbuka, tutup pratinjau
      if (isPrintMenuOpen) {
        setIsPrintMenuOpen(false);
        return true;
      }
      // 3. Jika ada overlay laporan penjualan terbuka, tutup laporan
      if (isSalesReportOpen) {
        setIsSalesReportOpen(false);
        return true;
      }
      // 4. Jika ada overlay semua riwayat terbuka dari beranda, tutup riwayat
      if (isAllHistoryOpen) {
        setIsAllHistoryOpen(false);
        return true;
      }
      // 5. Jika sedang di tab selain Beranda, kembali ke Beranda
      if (activeTab !== 'Beranda') {
        setActiveTab('Beranda');
        return true;
      }
      // 6. Jika di Beranda dan tidak ada modal, tetap tahan agar aplikasi tidak tertutup tanpa sengaja
      return true;
    }, 10);
  }, [selectedOrderId, isPrintMenuOpen, isAllHistoryOpen, isSalesReportOpen, activeTab]);

  // Nilai posisi gradasi latar dinamis: 0 (Beranda), 0.5 (Menu), 1 (Akun)
  const bgT = activeTab === 'Beranda' ? 0 : (activeTab === 'Menu' || activeTab === 'Riwayat') ? 0.5 : 1;

  // 1. Layar Intro Tati’e Kitchen yang sama persis seperti di Tablet
  if (showIntro) {
    return (
      <div className="tk-phone-root" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--scr-bg)' }}>
        <div
          className="tk-global-bg"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <DynamicBackground />
        </div>
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          <IntroScreen onFinish={() => setShowIntro(false)} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="tk-phone-root"
      style={{
        '--bg-t': bgT,
      } as React.CSSProperties}
    >
      {/* Seamless Global Dynamic Background seperti di tablet: bergerak halus sesuai nilai t (--bg-t), tidak patah, tidak terpotong */}
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

      {/* Area Layar Utama (Swipeable Horizontal Pager: Beranda, Menu, Akun) */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
        }}
      >
        <SwipePager
          trackRef={trackRef}
          progress={progress}
          isDragging={isDragging}
          onPointerDown={handlePagerPointerDown}
          onPointerMove={handlePagerPointerMove}
          onPointerUp={handlePagerPointerUp}
          onPointerCancel={handlePagerPointerCancel}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <PhoneHomeScreen
              onOpenAllHistory={() => setIsAllHistoryOpen(true)}
              onOpenSalesReport={() => setIsSalesReportOpen(true)}
              onSelectOrder={(id) => setSelectedOrderId(id)}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <PhoneMenuScreen />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <PhoneAccountScreen onOpenPrintMenu={() => setIsPrintMenuOpen(true)} />
          </div>
        </SwipePager>

        {/* Overlay Semua Riwayat jika dibuka dari Beranda */}
        {isAllHistoryOpen && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 60,
              background: 'var(--scr-bg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'tk-fade-in 0.2s ease-out',
            }}
          >
            <PhoneHistoryScreen
              onBack={() => setIsAllHistoryOpen(false)}
              onSelectOrder={(id) => setSelectedOrderId(id)}
            />
          </div>
        )}

        {/* Overlay Laporan Penjualan jika dibuka dari Beranda */}
        {isSalesReportOpen && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 60,
              background: 'var(--scr-bg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'tk-fade-in 0.2s ease-out',
            }}
          >
            <PhoneSalesReportScreen onBack={() => setIsSalesReportOpen(false)} />
          </div>
        )}

        {/* Overlay Detail Pesanan jika dipilih */}
        {selectedOrderId && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 70,
              background: 'var(--scr-bg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'tk-fade-in 0.2s ease-out',
            }}
          >
            <PhoneOrderDetailScreen
              onBack={() => {
                setSelectedOrderId(null);
                useHistoryStore.getState().setSelectedOrder(null);
              }}
            />
          </div>
        )}

        {/* Overlay Pratinjau Cetak Menu Fisik A4 */}
        {isPrintMenuOpen && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 80,
              background: 'var(--scr-bg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'tk-fade-in 0.2s ease-out',
            }}
          >
            <PhonePrintMenuPreview
              isOpen={true}
              onClose={() => setIsPrintMenuOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Floating Liquid Glass Pill Navbar di Bagian Bawah (Sembunyi saat Cetak Menu atau Rincian) */}
      {!isModalOrOverlayActive && (
        <div className="tk-phone-navbar-wrap">
          <NavbarPill
            items={PHONE_NAV_TABS}
            activeItem={activeTab === 'Riwayat' ? 'Menu' : activeTab}
            onSelect={scrollToTab}
            progress={progress}
            isDragging={isDragging}
            navRef={navbarRef}
            indicatorRef={indicatorRef}
          />
        </div>
      )}

      {/* Container Portal untuk Dialog & Sheet agar terkurung rapi di dalam Frame Layar Android */}
      <div
        id="tk-portal-root"
        className="tk-phone-portal-root"
      />

      {/* Global Toast Notification on Phone (Always above dialogs, zIndex 9999) */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            bottom: '84px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            pointerEvents: 'none',
            width: 'max-content',
            maxWidth: '90%',
          }}
        >
          <Toast message={toastMessage} />
        </div>
      )}
    </div>
  );
};

export default PhoneRoot;
