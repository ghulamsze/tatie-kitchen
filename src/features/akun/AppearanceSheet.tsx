import React from 'react';
import {
  ThemeMode,
  Palette,
  PALETTES,
  applyTheme,
  applyPalette,
  getStoredTheme,
  getStoredPalette,
} from '../../design/theme.ts';
import { Button } from '../../design/components/Button.tsx';
import { Sheet } from '../../design/components/Sheet.tsx';
import {
  BETA_DYNAMIC_BG,
  BgMotionMode,
  getStoredBgMotion,
  setStoredBgMotion,
} from '../../design/dynamicBg/index.ts';

export interface AppearanceSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppearanceSheet: React.FC<AppearanceSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const [mode, setMode] = React.useState<ThemeMode>(getStoredTheme);
  const [palette, setPalette] = React.useState<Palette>(getStoredPalette);
  const [bgMotion, setBgMotion] = React.useState<BgMotionMode>(getStoredBgMotion);

  if (!isOpen) return null;

  const handleModeChange = (newMode: ThemeMode) => {
    setMode(newMode);
    applyTheme(newMode);
  };

  const handlePaletteChange = (newPalette: Palette) => {
    setPalette(newPalette);
    applyPalette(newPalette);
  };

  const handleBgMotionChange = (newMotion: BgMotionMode) => {
    setBgMotion(newMotion);
    setStoredBgMotion(newMotion);
  };

  const modeOptions: [ThemeMode, string][] = [
    ['system', 'Sistem'],
    ['light', 'Terang'],
    ['dark', 'Gelap'],
  ];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Tampilan">
      {/* Pilihan Mode Tema */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {modeOptions.map(([m, label]) => {
          const isSelected = mode === m;
          return (
            <button
              key={m}
              type="button"
              className={`tk-option ${isSelected ? 'active' : ''}`}
              onClick={() => handleModeChange(m)}
              aria-pressed={isSelected}
            >
              <span>{label}</span>
              {isSelected && <span style={{ fontWeight: 800 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Pilihan Swatch Palet Warna */}
      <div
        role="group"
        aria-label="Warna Palet"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
        }}
      >
        {PALETTES.map((p) => {
          const isSelected = palette === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className="tk-theme-swatch"
              onClick={() => handlePaletteChange(p.id)}
              aria-label={p.name}
              aria-pressed={isSelected}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid rgb(var(--w) / 0.4)',
                outline: isSelected ? '2px solid var(--ring)' : 'none',
                outlineOffset: '2px',
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${p.darkBg} 50%, ${p.accent} 50%)`,
                padding: 0,
                boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>

      {/* Selector Mode Latar Belakang (Beta Dynamic Background) */}
      {BETA_DYNAMIC_BG && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 10px' }}>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Latar Belakang
          </label>
          <div
            style={{
              display: 'flex',
              background: 'var(--ctl)',
              border: '1px solid var(--ctl-line)',
              borderRadius: 'var(--r-md)',
              padding: '3px',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => handleBgMotionChange('static')}
              style={{
                flex: 1,
                height: '36px',
                borderRadius: 'calc(var(--r-md) - 3px)',
                border: 'none',
                background: bgMotion === 'static' ? 'var(--sel)' : 'transparent',
                color: bgMotion === 'static' ? 'var(--ink)' : 'var(--ink-3)',
                fontWeight: bgMotion === 'static' ? 800 : 600,
                fontSize: 'var(--t-xs)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>Statis</span>
            </button>
            <button
              type="button"
              onClick={() => handleBgMotionChange('dynamic')}
              style={{
                flex: 1,
                height: '36px',
                borderRadius: 'calc(var(--r-md) - 3px)',
                border: 'none',
                background: bgMotion === 'dynamic' ? 'var(--accent)' : 'transparent',
                color: bgMotion === 'dynamic' ? 'var(--on-accent)' : 'var(--ink-3)',
                fontWeight: bgMotion === 'dynamic' ? 800 : 600,
                fontSize: 'var(--t-xs)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>Dinamis</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 'var(--r-pill)',
                  background: bgMotion === 'dynamic' ? 'rgba(0, 0, 0, 0.25)' : 'var(--ctl-line)',
                  color: bgMotion === 'dynamic' ? '#ffffff' : 'var(--ink-2)',
                  letterSpacing: '0.02em',
                }}
              >
                BETA
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Tombol Utama Lime Selesai */}
      <Button variant="lime" onClick={onClose} style={{ width: '100%', marginTop: '4px' }}>
        Selesai
      </Button>
    </Sheet>
  );
};

