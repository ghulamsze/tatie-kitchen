import React, { useState } from 'react';
import { NavItem, NavbarPill } from '../../design/components/NavbarPill.tsx';
import { PhoneHomeScreen } from './screens/PhoneHomeScreen.tsx';
import { PhoneHistoryScreen } from './screens/PhoneHistoryScreen.tsx';
import { PhoneAccountScreen } from './screens/PhoneAccountScreen.tsx';

export const PhoneRoot: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItem>('Home');

  return (
    <div
      className="scr tk-phone-root"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* Area Layar Utama */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {activeTab === 'Home' && (
          <PhoneHomeScreen onNavigateToHistory={() => setActiveTab('Riwayat')} />
        )}
        {activeTab === 'Riwayat' && <PhoneHistoryScreen />}
        {activeTab === 'Akun' && <PhoneAccountScreen />}
      </div>

      {/* Floating Liquid Glass Pill Navbar di Bagian Bawah */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          width: 'min(330px, calc(100% - 32px))',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
      >
        <NavbarPill
          activeItem={activeTab}
          onSelect={(item) => setActiveTab(item)}
        />
      </div>
    </div>
  );
};

export default PhoneRoot;
