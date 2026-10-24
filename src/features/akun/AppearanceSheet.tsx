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

  if (!isOpen) return null;

  const handleModeChange = (newMode: ThemeMode) => {
    setMode(newMode);
    applyTheme(newMode);
  };

  const handlePaletteChange = (newPalette: Palette) => {
    setPalette(newPalette);
    applyPalette(newPalette);
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

      {/* Tombol Utama Lime Selesai */}
      <Button variant="lime" onClick={onClose} style={{ width: '100%', marginTop: '4px' }}>
        Selesai
      </Button>
    </Sheet>
  );
};

