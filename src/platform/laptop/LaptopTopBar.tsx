import React, { useState } from 'react';
import { useLaptopAuthStore } from './laptopAuthStore.ts';

export interface LaptopTopBarProps {
  title: string;
  showRangeFilter?: boolean;
  actions?: React.ReactNode;
  onRangeClick?: () => void;
}

export const LaptopTopBar: React.FC<LaptopTopBarProps> = ({
  title,
  showRangeFilter = true,
  actions,
  onRangeClick,
}) => {
  const { selectedRange, setSelectedRange } = useLaptopAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const rangePresets = [
    'Hari ini · 21 Okt 2026',
    'Kemarin · 20 Okt 2026',
    '7 hari terakhir',
    '30 hari terakhir',
    'Bulan ini',
  ];

  const handleSelect = (r: string) => {
    setSelectedRange(r);
    setIsDropdownOpen(false);
  };

  return (
    <header className="tk-laptop-topbar tp">
      <h2>{title}</h2>

      <div className="tk-laptop-topbar-actions">
        {actions}

        {showRangeFilter && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="tk-laptop-range-btn g"
              onClick={() => {
                if (onRangeClick) onRangeClick();
                else setIsDropdownOpen((prev) => !prev);
              }}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-label="Pilih rentang waktu"
            >
              <span>{selectedRange.includes('·') ? selectedRange : `${selectedRange} · 21 Okt 2026`}</span>
              <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>▾</span>
            </button>

            {isDropdownOpen && (
              <div
                className="g-liquid"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '260px',
                  borderRadius: 'var(--r-md)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 20,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
                }}
                role="listbox"
              >
                {rangePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--r-sm)',
                      background: selectedRange === preset ? 'var(--accent)' : 'transparent',
                      color: selectedRange === preset ? 'var(--accent-ink)' : 'var(--ink)',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 'var(--t-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onClick={() => handleSelect(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
