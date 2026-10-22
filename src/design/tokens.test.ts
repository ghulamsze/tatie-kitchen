import { describe, it, expect } from 'vitest';
import { PALETTES, applyTheme, applyPalette, getStoredTheme, getStoredPalette } from './theme.ts';
import fs from 'fs';
import path from 'path';

describe('Design Tokens & System Audit', () => {
  it('harus memuat 6 palet resmi sesuai spesifikasi', () => {
    expect(PALETTES.length).toBe(6);
    const ids = PALETTES.map((p) => p.id);
    expect(ids).toEqual(['netflix', 'mono', 'hijau', 'samudra', 'senja', 'blush']);
  });

  it('harus memiliki 7 pasangan skala teks yang sah di tokens.css', () => {
    const cssContent = fs.readFileSync(path.resolve(__dirname, 'tokens.css'), 'utf-8');

    // 7 pasangan teks
    expect(cssContent).toMatch(/--t-xs:\s*12px;[\s\S]*?--l-xs:\s*16px;/);
    expect(cssContent).toMatch(/--t-sm:\s*14px;[\s\S]*?--l-sm:\s*20px;/);
    expect(cssContent).toMatch(/--t-md:\s*16px;[\s\S]*?--l-md:\s*24px;/);
    expect(cssContent).toMatch(/--t-lg:\s*20px;[\s\S]*?--l-lg:\s*28px;/);
    expect(cssContent).toMatch(/--t-xl:\s*32px;[\s\S]*?--l-xl:\s*40px;/);
    expect(cssContent).toMatch(/--t-2xl:\s*44px;[\s\S]*?--l-2xl:\s*52px;/);
    expect(cssContent).toMatch(/--t-3xl:\s*64px;[\s\S]*?--l-3xl:\s*72px;/);
  });

  it('kontrol tinggi tetap wajib kelipatan 4: 40, 48, 56', () => {
    const cssContent = fs.readFileSync(path.resolve(__dirname, 'tokens.css'), 'utf-8');
    expect(cssContent).toContain('--c-sm: 40px;');
    expect(cssContent).toContain('--c-md: 48px;');
    expect(cssContent).toContain('--c-lg: 56px;');
  });

  it('radius wajib sesuai aturan: 12, 16, 24, 32, dan pil', () => {
    const cssContent = fs.readFileSync(path.resolve(__dirname, 'tokens.css'), 'utf-8');
    expect(cssContent).toContain('--r-sm: 12px;');
    expect(cssContent).toContain('--r-md: 16px;');
    expect(cssContent).toContain('--r-lg: 24px;');
    expect(cssContent).toContain('--r-xl: 32px;');
    expect(cssContent).toContain('--r-pill: 9999px;');
  });

  it('harus menerapkan tema dan palet ke atribut documentElement', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    applyPalette('samudra');
    expect(document.documentElement.dataset.palette).toBe('samudra');

    applyPalette('netflix');
    expect(document.documentElement.dataset.palette).toBe('netflix');
  });

  it('bawaan tema adalah dark dan palet bawaan adalah netflix', () => {
    localStorage.clear();
    expect(getStoredTheme()).toBe('dark');
    expect(getStoredPalette()).toBe('netflix');
  });

  it('harus menyediakan fallback prefers-reduced-transparency dan prefers-reduced-motion', () => {
    const cssContent = fs.readFileSync(path.resolve(__dirname, 'tokens.css'), 'utf-8');
    expect(cssContent).toContain('@media (prefers-reduced-transparency: reduce)');
    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('semua 6 palet harus mendefinisikan override --bg, --accent, dan --accent-ink pada mode gelap dan terang', () => {
    const cssContent = fs.readFileSync(path.resolve(__dirname, 'tokens.css'), 'utf-8');
    const palettes = ['netflix', 'mono', 'hijau', 'samudra', 'senja', 'blush'];

    palettes.forEach((p) => {
      // Cek definisi palet di css
      expect(cssContent).toContain(`data-palette="${p}"`);

      // Cek keberadaan token esensial per palet gelap
      const darkBlockRegex = new RegExp(`:root\\[data-palette="${p}"\\]:not\\(\\[data-theme="light"\\]\\)[\\s\\S]*?\\}`);
      const darkMatch = cssContent.match(darkBlockRegex);
      expect(darkMatch, `Blok palet gelap untuk ${p} harus ada di tokens.css`).not.toBeNull();
      if (darkMatch) {
        expect(darkMatch[0]).toContain('--bg:');
        expect(darkMatch[0]).toContain('--accent:');
        expect(darkMatch[0]).toContain('--accent-ink:');
      }

      // Cek keberadaan token esensial palet terang
      if (p !== 'netflix') {
        const lightBlockRegex = new RegExp(`:root\\[data-palette="${p}"\\]\\[data-theme="light"\\][\\s\\S]*?\\}`);
        const lightMatch = cssContent.match(lightBlockRegex);
        expect(lightMatch, `Blok palet terang untuk ${p} harus ada di tokens.css`).not.toBeNull();
        if (lightMatch) {
          expect(lightMatch[0]).toContain('--bg:');
          expect(lightMatch[0]).toContain('--accent:');
          expect(lightMatch[0]).toContain('--accent-ink:');
        }
      } else {
        // Netflix terang didefinisikan pada blok :root dasar
        expect(cssContent).toContain('--accent: #d92b33;');
        expect(cssContent).toContain('--accent-ink: #b3121a;');
      }
    });
  });
});
