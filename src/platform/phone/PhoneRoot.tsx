import React, { useState, useEffect } from 'react';
import { NavItem, NavbarPill } from '../../design/components/NavbarPill.tsx';
import { IntroScreen } from '../../features/intro/IntroScreen.tsx';
import { PhoneHomeScreen } from './screens/PhoneHomeScreen.tsx';
import { PhoneHistoryScreen } from './screens/PhoneHistoryScreen.tsx';
import { PhoneOrderDetailScreen } from './screens/PhoneOrderDetailScreen.tsx';
import { PhoneAccountScreen } from './screens/PhoneAccountScreen.tsx';
import { PhoneSalesReportScreen } from './screens/PhoneSalesReportScreen.tsx';
import { PhonePrintMenuPreview } from './components/PhonePrintMenuPreview.tsx';
import { initPosRealtimeSync } from '../../lib/supabase/realtime.ts';
import { registerBackHandler } from '../../lib/device/backButton.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';

export const PhoneRoot: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavItem>('Beranda');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState<boolean>(false);
  const [isAllHistoryOpen, setIsAllHistoryOpen] = useState<boolean>(false);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState<boolean>(false);

  // Sinkronisasi real-time dua arah berbasis database Supabase di perangkat HP
  useEffect(() => {
    const cleanup = initPosRealtimeSync();
    useCashierStore.getState().fetchCashiers().catch(() => {});
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

  // Nilai posisi gradasi latar dinamis: 0 (Beranda), 0.5 (Riwayat), 1 (Akun)
  const bgT = activeTab === 'Beranda' ? 0 : activeTab === 'Riwayat' ? 0.5 : 1;

  // 1. Layar Intro Tati’e Kitchen yang sama persis seperti di Tablet
  if (showIntro) {
    return (
      <div className="tk-phone-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <IntroScreen onFinish={() => setShowIntro(false)} />
      </div>
    );
  }

  return (
    <div
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
            transition: 'background 0.3s ease',
          }}
        />
      </div>

      {/* Area Layar Utama (Navigasi Beranda, Riwayat, Akun via Tab Bar Bawah tanpa Geser Layar) */}
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
        {activeTab === 'Beranda' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <PhoneHomeScreen
              onOpenAllHistory={() => setIsAllHistoryOpen(true)}
              onOpenSalesReport={() => setIsSalesReportOpen(true)}
              onSelectOrder={(id) => setSelectedOrderId(id)}
            />
          </div>
        )}

        {activeTab === 'Riwayat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <PhoneHistoryScreen onSelectOrder={(id) => setSelectedOrderId(id)} />
          </div>
        )}

        {activeTab === 'Akun' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <PhoneAccountScreen onOpenPrintMenu={() => setIsPrintMenuOpen(true)} />
          </div>
        )}

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
            <PhoneOrderDetailScreen onBack={() => setSelectedOrderId(null)} />
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
            activeItem={activeTab}
            onSelect={(item) => setActiveTab(item)}
          />
        </div>
      )}

      {/* Container Portal untuk Dialog & Sheet agar terkurung rapi di dalam Frame Layar Android */}
      <div
        id="tk-portal-root"
        className="tk-phone-portal-root"
      />
    </div>
  );
};

export default PhoneRoot;
