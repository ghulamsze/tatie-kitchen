import React, { useState } from 'react';
import { LaptopSidebar } from './LaptopSidebar.tsx';
import { PALETTES, applyPalette, applyTheme, getStoredPalette, getStoredTheme, Palette, ThemeMode } from '../../design/theme.ts';
import { Button } from '../../design/components/Button.tsx';

export interface LaptopLayoutProps {
  children: React.ReactNode;
}

export const LaptopLayout: React.FC<LaptopLayoutProps> = ({ children }) => {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currentTheme, setCurrentThemeState] = useState<ThemeMode>(getStoredTheme());
  const [currentPal, setCurrentPalState] = useState<Palette>(getStoredPalette());

  const handleThemeChange = (mode: ThemeMode) => {
    setCurrentThemeState(mode);
    applyTheme(mode);
  };

  const handlePaletteChange = (pal: Palette) => {
    setCurrentPalState(pal);
    applyPalette(pal);
  };

  return (
    <div className="tk-laptop-shell scr">
      <div className="tk-laptop-container lp">
        <LaptopSidebar onOpenThemeModal={() => setIsThemeModalOpen(true)} />
        <main className="tk-laptop-content lc">{children}</main>
      </div>

      {/* Modal Tampilan (Tema & Palet Warna) */}
      {isThemeModalOpen && (
        <div className="tk-laptop-overlay" onClick={() => setIsThemeModalOpen(false)}>
          <div
            className="tk-laptop-dialog g-liquid"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="theme-dialog-title"
            style={{ maxWidth: '440px' }}
          >
            <b className="dt" id="theme-dialog-title">
              Tampilan & Tema
            </b>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: 'var(--t-xs)', fontWeight: 700, color: 'var(--ink-3)' }}>MODE TEMA</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    style={{
                      height: '40px',
                      borderRadius: 'var(--r-md)',
                      background: currentTheme === mode ? 'var(--accent)' : 'var(--ctl)',
                      color: currentTheme === mode ? 'var(--accent-ink)' : 'var(--ink)',
                      border: '1px solid var(--ctl-line)',
                      fontWeight: 700,
                      fontSize: 'var(--t-sm)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                    onClick={() => handleThemeChange(mode)}
                  >
                    {mode === 'system' ? 'Sistem' : mode === 'light' ? 'Terang' : 'Gelap'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <span style={{ fontSize: 'var(--t-xs)', fontWeight: 700, color: 'var(--ink-3)' }}>PALET WARNA</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {PALETTES.map((p) => {
                  const isSelected = currentPal === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: 'var(--r-md)',
                        background: isSelected ? 'rgb(var(--w) / 0.16)' : 'var(--ctl)',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--ctl-line)',
                        color: 'var(--ink)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 'var(--t-sm)',
                      }}
                      onClick={() => handlePaletteChange(p.id)}
                    >
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: p.accent,
                          border: '1px solid rgba(0,0,0,0.2)',
                          flexShrink: 0,
                        }}
                      />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              variant="lime"
              size="md"
              onClick={() => setIsThemeModalOpen(false)}
              style={{ width: '100%', marginTop: '12px' }}
            >
              Selesai
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
