import React from 'react';

export type NavItem = 'Home' | 'Riwayat' | 'Akun';

export interface NavbarPillProps {
  activeItem: NavItem;
  onSelect: (item: NavItem) => void;
}

export const NavbarPill: React.FC<NavbarPillProps> = ({
  activeItem,
  onSelect,
}) => {
  const items: NavItem[] = ['Home', 'Riwayat', 'Akun'];

  return (
    <nav className="g-liquid tk-navbar" aria-label="Navigasi Utama">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={`tk-navbar-item ${activeItem === item ? 'active' : ''}`}
          onClick={() => onSelect(item)}
          aria-current={activeItem === item ? 'page' : undefined}
        >
          {item}
        </button>
      ))}
    </nav>
  );
};
