import React, { useState, useEffect } from 'react';
import { NavItem, NavbarPill } from '../../design/components/NavbarPill.tsx';
import { PhoneHomeScreen } from './screens/PhoneHomeScreen.tsx';
import { PhoneHistoryScreen } from './screens/PhoneHistoryScreen.tsx';
import { PhoneOrderDetailScreen } from './screens/PhoneOrderDetailScreen.tsx';
import { PhoneAccountScreen } from './screens/PhoneAccountScreen.tsx';
import { SwipePager } from '../tablet/SwipePager.tsx';
import { useSwipeNav } from '../tablet/useSwipeNav.ts';
import { initPosRealtimeSync } from '../../lib/supabase/realtime.ts';

const PHONE_NAV_TABS: NavItem[] = ['Home', 'Riwayat', 'Akun'];

export const PhoneRoot: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItem>('Home');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Sinkronisasi real-time dua arah berbasis database Supabase di perangkat HP
  useEffect(() => {
    const cleanup = initPosRealtimeSync();
    return () => {
      cleanup();
    };
  }, []);

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
    tabs: PHONE_NAV_TABS,
    activeTab,
    onTabChange: setActiveTab,
  });

  return (
    <div ref={containerRef} className="tk-phone-root">
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
          }}
        />
      </div>

      {/* Area Layar Utama Swipeable */}
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
          <PhoneHomeScreen
            onNavigateToHistory={() => scrollToTab('Riwayat')}
            onSelectOrder={(id) => setSelectedOrderId(id)}
          />
          <PhoneHistoryScreen onSelectOrder={(id) => setSelectedOrderId(id)} />
          <PhoneAccountScreen />
        </SwipePager>

        {/* Overlay Detail Pesanan jika dipilih */}
        {selectedOrderId && (
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
            <PhoneOrderDetailScreen onBack={() => setSelectedOrderId(null)} />
          </div>
        )}
      </div>

      {/* Floating Liquid Glass Pill Navbar di Bagian Bawah */}
      {!selectedOrderId && (
        <div className="tk-phone-navbar-wrap">
          <NavbarPill
            activeItem={activeTab}
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
          />
        </div>
      )}
    </div>
  );
};

export default PhoneRoot;
