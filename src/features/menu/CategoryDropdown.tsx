import React, { useState, useMemo, useRef, useEffect } from 'react';

export interface CategoryDropdownProps {
  label: string;
  selectedGroupId: string;
  groups: { id: string; name: string }[];
  onSelectGroup: (groupId: string) => void;
  direction?: 'down' | 'up';
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  label,
  selectedGroupId,
  groups,
  onSelectGroup,
  direction = 'down',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Urutkan grup secara alfabetis A-Z sesuai instruksi
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [groups]);

  const selectedGroup = sortedGroups.find((g) => g.id === selectedGroupId) || sortedGroups[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside as any);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside as any);
    };
  }, [isOpen]);

  const isUp = direction === 'up';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 800,
          color: 'var(--ink-3)',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </label>

      {/* Trigger Button Liquid Glass */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          height: '42px',
          padding: '0 12px',
          borderRadius: 'var(--r-md)',
          background: 'var(--ctl)',
          border: isOpen ? '1.5px solid var(--accent)' : '1px solid var(--ctl-line)',
          color: 'var(--ink)',
          fontSize: 'var(--t-sm)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s ease',
        }}
      >
        <span>{selectedGroup?.name || 'Pilih Kategori'}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isUp
              ? (isOpen ? 'rotate(0deg)' : 'rotate(180deg)')
              : (isOpen ? 'rotate(180deg)' : 'rotate(0deg)'),
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: 0.75,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown / Dropup Options Popup (Liquid Glass Pekat & Blur 28px) */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            ...(isUp
              ? { bottom: 'calc(100% + 4px)', top: 'auto' }
              : { top: 'calc(100% + 4px)', bottom: 'auto' }),
            left: 0,
            right: 0,
            zIndex: 60,
            background: 'color-mix(in srgb, var(--fl-bg) 96%, #000 4%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--ctl-line)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px',
            animation: 'tk-fade-in 0.15s ease',
          }}
        >
          {sortedGroups.map((g) => {
            const isSelected = g.id === selectedGroupId;
            return (
              <button
                key={g.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectGroup(g.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--r-sm)',
                  background: isSelected ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--ink)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 'var(--t-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                  transition: 'background 0.12s ease',
                }}
              >
                <span>{g.name}</span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

