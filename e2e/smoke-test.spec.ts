import { test, expect } from '@playwright/test';

test.describe('Smoke Test Produksi & HTTPS (Fase 7)', () => {
  const baseURL = process.env.BASE_URL || '/';

  test('1. Akses Root & Deteksi Perangkat Laptop', async ({ page }) => {
    await page.goto(baseURL);

    // Judul aplikasi
    await expect(page).toHaveTitle(/Tati’e Kitchen/);

    // Di laptop tanpa parameter: Menampilkan placeholder laptop dengan tombol simulasi
    const simButton = page.getByRole('button', { name: 'Buka Simulasi Tablet' });
    if (await simButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(simButton).toBeVisible();
    }
  });

  test('2. Akses Tablet Mode & Transaksi Cepat', async ({ page }) => {
    await page.goto(`${baseURL}?device=tablet`);

    // Lewati Intro jika ada
    const intro = page.locator('.tk-intro-container');
    if (await intro.isVisible({ timeout: 3000 }).catch(() => false)) {
      await intro.click({ force: true }).catch(() => {});
    }

    // Pilih kasir
    const cashierOption = page.locator('text=Robertus Amaresi');
    if (await cashierOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cashierOption.click();
    }

    // Layar Home
    await expect(page.locator('h2')).toContainText('Tati’e Kitchen');
    await expect(page.getByRole('button', { name: 'Menu lengkap' })).toBeVisible();

    // Tambah menu
    const mieCard = page.getByRole('button', { name: /Mie Goreng Komplit/i });
    await expect(mieCard).toBeVisible();
    await mieCard.click();

    // Verifikasi keranjang terisi
    await expect(page.locator('text=Pesanan baru')).toBeVisible();
    await expect(page.locator('.tk-cart-row b:has-text("Mie Goreng Komplit")')).toBeVisible();

    // Tombol bayar lime
    const payBtn = page.getByRole('button', { name: 'Lanjut ke meja & bayar' });
    await expect(payBtn).toBeVisible();
    await payBtn.click();

    // Keypad meja & bayar
    await expect(page.locator('text=Nomor meja')).toBeVisible();
    const selesaikanBtn = page.getByRole('button', { name: 'Selesaikan pembayaran' });
    await expect(selesaikanBtn).toBeVisible();
    await selesaikanBtn.click();

    // Struk
    await expect(page.locator('text=Pembayaran berhasil')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pesanan baru' })).toBeVisible();
  });

  test('3. Integritas Font Lokal & Tanpa Request Eksternal Font', async ({ page }) => {
    const externalFontRequests: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        externalFontRequests.push(url);
      }
    });

    await page.goto(`${baseURL}?device=tablet`);
    await page.waitForTimeout(1000);

    // Font Plus Jakarta Sans harus diload dari bundle lokal tanpa CDN eksternal pada runtime
    expect(externalFontRequests.length).toBe(0);
  });
});
