import React, { useRef, useEffect } from 'react';
import { useLaptopAuthStore, LaptopTab } from './laptopAuthStore.ts';

const NAV_TABS: LaptopTab[] = ['Home', 'Riwayat', 'Menu', 'Kasir', 'Laporan', 'Pengaturan'];

export interface LaptopSidebarProps {
  onOpenThemeModal?: () => void;
}

export const LaptopSidebar: React.FC<LaptopSidebarProps> = ({ onOpenThemeModal }) => {
  const { activeTab, setActiveTab, isProfileMenuOpen, toggleProfileMenu, logout } = useLaptopAuthStore();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Tutup menu bubble saat mengklik di luar area sidebar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        toggleProfileMenu(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen, toggleProfileMenu]);

  return (
    <aside className="tk-laptop-sidebar g-acrylic" ref={sidebarRef}>
      <h3>Tati’e Kitchen</h3>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} aria-label="Menu navigasi laptop">
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              className={`tk-laptop-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Profil Pemilik di Bagian Bawah (.me) */}
      <div
        className="tk-laptop-profile-card"
        onClick={() => toggleProfileMenu()}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isProfileMenuOpen}
        aria-label="Menu akun pemilik"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleProfileMenu();
          }
        }}
      >
        <i className="tk-laptop-avatar av2">P</i>
        <div className="tk-laptop-profile-info">
          <b>Pemilik</b>
          <small>Tati’e Kitchen</small>
        </div>
      </div>

      {/* Popover Bubble Menu (.bub) */}
      {isProfileMenuOpen && (
        <div className="tk-laptop-bubble-menu g-liquid bub" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setActiveTab('Akun');
              toggleProfileMenu(false);
            }}
          >
            Akun saya
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              toggleProfileMenu(false);
              if (onOpenThemeModal) {
                onOpenThemeModal();
              } else {
                setActiveTab('Akun');
              }
            }}
          >
            Tampilan
          </button>
          <button
            type="button"
            className="danger out"
            role="menuitem"
            onClick={() => logout()}
          >
            Keluar
          </button>
        </div>
      )}
    </aside>
  );
};
