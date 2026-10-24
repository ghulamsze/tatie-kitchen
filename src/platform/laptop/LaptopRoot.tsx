import React, { useEffect } from 'react';
import { useLaptopAuthStore } from './laptopAuthStore.ts';
import { LaptopLoginScreen } from './LaptopLoginScreen.tsx';
import { LaptopLayout } from './LaptopLayout.tsx';
import { LaptopTopBar } from './LaptopTopBar.tsx';
import { initPosRealtimeSync } from '../../lib/supabase/realtime.ts';

export const LaptopRoot: React.FC = () => {
  const { isAuthenticated, activeTab } = useLaptopAuthStore();

  // Aktifkan Realtime WebSocket Supabase sync untuk desktop admin
  useEffect(() => {
    const cleanup = initPosRealtimeSync();
    return () => {
      cleanup();
    };
  }, []);

  if (!isAuthenticated) {
    return <LaptopLoginScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return (
          <>
            <LaptopTopBar title="Home" />
            <div
              className="g-acrylic"
              style={{
                padding: '32px',
                borderRadius: 'var(--r-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)' }}>Selamat datang, Pemilik</b>
              <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)' }}>
                Sistem admin desktop siap. Layar Home lengkap dengan KPI, grafik batang transaksi per jam, dan daftar transaksi terbaru akan dikerjakan pada Fase 2.
              </p>
            </div>
          </>
        );

      case 'Riwayat':
        return (
          <>
            <LaptopTopBar title="Riwayat" />
            <div className="g-acrylic" style={{ padding: '32px', borderRadius: 'var(--r-lg)' }}>
              <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)' }}>Riwayat Transaksi</b>
              <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 'var(--t-sm)' }}>
                Split-view tabel transaksi, dialog ekspor (Excel/PDF/CSV), dan unduh struk PNG disiapkan pada Fase 3.
              </p>
            </div>
          </>
        );

      case 'Menu':
        return (
          <>
            <LaptopTopBar title="Menu" />
            <div className="g-acrylic" style={{ padding: '32px', borderRadius: 'var(--r-lg)' }}>
              <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)' }}>Katalog Menu</b>
              <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 'var(--t-sm)' }}>
                Tabel menu, form edit harga/status, dan modal tambah menu disiapkan pada Fase 4.
              </p>
            </div>
          </>
        );

      case 'Kasir':
        return (
          <>
            <LaptopTopBar title="Kasir" />
            <div className="g-acrylic" style={{ padding: '32px', borderRadius: 'var(--r-lg)' }}>
              <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)' }}>Manajemen Kasir</b>
              <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 'var(--t-sm)' }}>
                Kartu kasir, modal tambah kasir, ubah nama, dan hapus kasir disiapkan pada Fase 6.
              </p>
            </div>
          </>
        );

      case 'Laporan':
        return (
          <>
            <LaptopTopBar title="Laporan" />
            <div className="g-acrylic" style={{ padding: '32px', borderRadius: 'var(--r-lg)' }}>
              <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)' }}>Laporan Penjualan</b>
              <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 'var(--t-sm)' }}>
                Grafik omzet harian dan menu terlaris otomatis disiapkan pada Fase 7.
              </p>
            </div>
          </>
        );

      case 'Pengaturan':
        return (
          <>
            <LaptopTopBar title="Pengaturan" />
            <div className="g-acrylic" style={{ padding: '32px', borderRadius: 'var(--r-lg)' }}>
              <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)' }}>Pengaturan Kafe</b>
              <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 'var(--t-sm)' }}>
                Pengaturan profil kafe, cetak struk, dan cadangkan data disiapkan pada Fase 8.
              </p>
            </div>
          </>
        );

      case 'Akun':
        return (
          <>
            <LaptopTopBar title="Akun" showRangeFilter={false} />
            <div
              className="g-acrylic"
              style={{
                padding: '36px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                width: '100%',
                maxWidth: '420px',
                borderRadius: 'var(--r-xl)',
              }}
            >
              <div
                className="g-liquid"
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: 'var(--r-xl)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 'var(--t-2xl)',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  border: '1px solid rgb(var(--w)/0.2)',
                }}
              >
                P
              </div>
              <div>
                <b style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', display: 'block' }}>Pemilik</b>
                <span style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-3)' }}>Tati’e Kitchen</span>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return <LaptopLayout>{renderContent()}</LaptopLayout>;
};
