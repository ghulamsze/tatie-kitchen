import { test, expect } from '@playwright/test';

test.describe('Routing dan Deteksi Perangkat (AppShell & DevFrame)', () => {
  test('di laptop tanpa parameter: menampilkan layar sementara laptop', async ({ page }) => {
    // Bersihkan override
    await page.goto('/?device=auto');

    await expect(page.locator('h1')).toContainText('Tati’e Kitchen untuk Laptop');
    await expect(page.locator('text=Sistem Admin Laptop')).toBeVisible();
    await expect(page.locator('text=Versi sistem admin web laptop dan berkas .exe belum tersedia')).toBeVisible();
  });

  test('dengan ?device=tablet: menampilkan DevFrame bingkai tablet 1024 x 640', async ({ page }) => {
    await page.goto('/?device=tablet');

    // Pastikan DevFrame aktif
    const devFrameHeader = page.locator('text=Simulasi Tablet Kasir');
    await expect(devFrameHeader).toBeVisible();

    const frameInner = page.locator('.dev-frame-inner');
    await expect(frameInner).toBeVisible();

    // Pastikan konten tablet termuat di dalam bingkai (Intro atau Siapa yang bertugas)
    await expect(page.locator('.tk-intro-container, h2')).toBeVisible();
  });

  test('dengan ?device=phone: menampilkan antarmuka ponsel pemilik (PhoneRoot & PhoneDevFrame)', async ({ page }) => {
    await page.goto('/?device=phone');

    await expect(page.locator('.tk-phone-root')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Home');
  });

  test('tombol Buka Simulasi Tablet di laptop mengalihkan ke mode tablet', async ({ page }) => {
    await page.goto('/?device=auto');
    const switchBtn = page.getByRole('button', { name: 'Buka Simulasi Tablet Kasir (1024 × 640)' });
    await switchBtn.click();

    await expect(page.locator('text=Simulasi Tablet Kasir')).toBeVisible();
  });
});
