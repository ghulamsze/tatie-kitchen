import { test, expect } from '@playwright/test';

test.describe('Audit Desain Galeri Komponen (1024 x 640)', () => {
  test.use({ viewport: { width: 1024, height: 640 } });

  test('harus memuat galeri komponen dan memvalidasi token netflix gelap & terang', async ({ page }) => {
    await page.goto('/');

    // Cek judul
    await expect(page).toHaveTitle(/Tati’e Kitchen/);

    // Cek heading galeri
    const heading = page.locator('h1');
    await expect(heading).toContainText('Galeri Komponen Tati’e Kitchen');

    // Cek atribut bawaan data-theme="dark" dan data-palette="netflix"
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    await expect(htmlElement).toHaveAttribute('data-palette', 'netflix');

    // Cek tombol utama lime
    const limeBtn = page.getByRole('button', { name: 'Tombol Utama Lime (P1)' });
    await expect(limeBtn).toBeVisible();

    // Cek pengalihan ke mode Terang
    const lightBtn = page.getByRole('button', { name: 'Terang' });
    await lightBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');

    // Cek pengalihan ke palet Hijau
    const hijauBtn = page.locator('button[title="Hijau"]');
    await hijauBtn.click();
    await expect(htmlElement).toHaveAttribute('data-palette', 'hijau');

    // Cek pengalihan kembali ke Netflix Gelap
    const netflixBtn = page.locator('button[title="Netflix"]');
    await netflixBtn.click();
    await expect(htmlElement).toHaveAttribute('data-palette', 'netflix');

    const darkBtn = page.getByRole('button', { name: 'Gelap' });
    await darkBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

    // Cek Banner No Internet
    const offlineBanner = page.locator('.tk-no-internet-banner');
    await expect(offlineBanner).toBeVisible();
    await expect(offlineBanner).toContainText('Koneksi terputus');
  });

  test('audit otomatis skala teks (hanya 7 ukuran yang diperbolehkan)', async ({ page }) => {
    await page.goto('/');

    // Skala yang diizinkan (px): 12, 14, 16, 20, 32, 44, 64
    const validSizes = [12, 14, 16, 20, 32, 44, 64];

    const violations = await page.evaluate((allowed) => {
      const invalid: { tag: string; text: string; fontSize: string }[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);

      let node = walker.nextNode();
      while (node) {
        const el = node as HTMLElement;
        const text = el.textContent?.trim();
        // Hanya cek elemen yang memiliki teks langsung
        const hasDirectText = Array.from(el.childNodes).some(
          (c) => c.nodeType === Node.TEXT_NODE && (c.textContent?.trim() || '').length > 0
        );

        if (hasDirectText && text) {
          const style = window.getComputedStyle(el);
          const size = parseFloat(style.fontSize);
          if (!allowed.includes(Math.round(size))) {
            invalid.push({ tag: el.tagName, text: text.slice(0, 30), fontSize: style.fontSize });
          }
        }
        node = walker.nextNode();
      }
      return invalid;
    }, validSizes);

    expect(violations.length).toBe(0);
  });
});
