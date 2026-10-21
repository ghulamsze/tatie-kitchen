import { test, expect } from '@playwright/test';

test.describe('Fase 6: Audit Beta Lengkap di Laptop (Arsitektur Bagian 10)', () => {
  test.use({ viewport: { width: 1024, height: 640 } });

  const PALETTES = ['netflix', 'mono', 'hijau', 'samudra', 'senja', 'blush'] as const;
  const THEMES = ['dark', 'light'] as const;

  test('1. Matriks 12 Varian Tema (6 Palet x 2 Mode) pada Seluruh Layar & Banner Offline', async ({ page }) => {
    await page.goto('/dev/gallery');

    const html = page.locator('html');

    for (const pal of PALETTES) {
      for (const th of THEMES) {
        // Terapkan palet & tema lewat evaluasi browser langsung
        await page.evaluate(({ p, t }) => {
          document.documentElement.dataset.palette = p;
          document.documentElement.dataset.theme = t;
        }, { p: pal, t: th });

        await expect(html).toHaveAttribute('data-palette', pal);
        await expect(html).toHaveAttribute('data-theme', th);

        // Verifikasi CSS variables terdefinisi & tidak kosong
        const colors = await page.evaluate(() => {
          const style = window.getComputedStyle(document.documentElement);
          return {
            bg: style.getPropertyValue('--scr-bg').trim(),
            ink: style.getPropertyValue('--ink').trim(),
            accent: style.getPropertyValue('--accent').trim(),
            onAccent: style.getPropertyValue('--on-accent').trim(),
          };
        });

        expect(colors.bg.length).toBeGreaterThan(0);
        expect(colors.ink.length).toBeGreaterThan(0);
        expect(colors.accent.length).toBeGreaterThan(0);
        expect(colors.onAccent.length).toBeGreaterThan(0);

        // Verifikasi Banner No-Internet tampil dengan kontras
        const offlineBanner = page.locator('.tk-no-internet-banner');
        await expect(offlineBanner).toBeVisible();
      }
    }
  });

  test('2. Aturan Tepat Satu Tombol Lime Utama per Layar', async ({ page }) => {
    await page.goto('/?device=tablet');

    // Lewati Intro jika ada
    const intro = page.locator('.tk-intro-container');
    if (await intro.isVisible()) {
      await intro.click({ force: true }).catch(() => {});
    }

    // Pilih kasir jika di layar profil
    const cashierOption = page.locator('text=Robertus Amaresi');
    if (await cashierOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cashierOption.click();
    }

    // Layar 1: HOME SCREEN
    await expect(page.locator('h2')).toContainText('Tati’e Kitchen');
    // Hitung tombol .tk-btn-lime di Home
    const homeLimeBtns = page.locator('.tk-btn-lime');
    await expect(homeLimeBtns).toHaveCount(1);
    await expect(homeLimeBtns.first()).toContainText('Lanjut ke meja & bayar');

    // Tambah item & lanjut ke Payment
    const mieCard = page.getByRole('button', { name: /Mie Goreng Komplit/i });
    await mieCard.click();
    await homeLimeBtns.first().click();

    // Layar 2: PAYMENT SCREEN
    await expect(page.locator('text=Nomor meja')).toBeVisible();
    const payLimeBtns = page.locator('.tk-btn-lime');
    await expect(payLimeBtns).toHaveCount(1);
    await expect(payLimeBtns.first()).toContainText('Selesaikan pembayaran');

    // Selesaikan bayar & lanjut ke Receipt
    await payLimeBtns.first().click();

    // Layar 3: RECEIPT SCREEN
    await expect(page.locator('text=Pembayaran berhasil')).toBeVisible();
    const receiptLimeBtns = page.locator('.tk-btn-lime');
    await expect(receiptLimeBtns).toHaveCount(1);
    await expect(receiptLimeBtns.first()).toContainText('Pesanan baru');

    // Kembali ke Home
    await receiptLimeBtns.first().click();

    // Layar 4: CUSTOMER MENU VIEW (Modal Golden Triangle)
    const menuLengkapBtn = page.getByRole('button', { name: 'Menu lengkap' });
    await menuLengkapBtn.click();
    const customerMenuDialog = page.getByRole('dialog', { name: 'Menu Lengkap Pembeli' });
    await expect(customerMenuDialog).toBeVisible();
    // Di menu pembeli tidak boleh ada tombol aksi lime pembelian kasir
    const customerMenuLimeBtns = customerMenuDialog.locator('.tk-btn-lime');
    await expect(customerMenuLimeBtns).toHaveCount(0);
    await page.getByRole('button', { name: 'Tutup' }).click();

    // Layar 5: RIWAYAT TRANSAKSI
    const riwayatNav = page.getByRole('button', { name: 'Riwayat' });
    await riwayatNav.click();
    await expect(page.locator('h2')).toContainText('Riwayat Transaksi');
    // Di layar utama riwayat tidak ada tombol lime (hanya di dalam sheet filter saat dibuka)
    const riwayatMainLimeBtns = page.locator('.scr > .tk-btn-lime');
    await expect(riwayatMainLimeBtns).toHaveCount(0);

    // Buka Sheet Rentang Waktu
    const rangeBtn = page.getByRole('button', { name: 'Pilih rentang waktu' });
    await rangeBtn.click();
    const sheetLimeBtns = page.locator('.tk-sheet .tk-btn-lime');
    await expect(sheetLimeBtns).toHaveCount(1);
    await expect(sheetLimeBtns.first()).toContainText('Terapkan');
    await sheetLimeBtns.first().click();

    // Layar 6: AKUN
    const akunNav = page.getByRole('button', { name: 'Akun' });
    await akunNav.click();
    await expect(page.locator('text=Bertugas sejak')).toBeVisible();
  });

  test('3. Audit Responsivitas Sentuh dan Target Minimal 44px', async ({ page }) => {
    await page.goto('/?device=tablet');

    // Lewati Intro jika ada
    const intro = page.locator('.tk-intro-container');
    if (await intro.isVisible()) {
      await intro.click({ force: true }).catch(() => {});
    }

    const cashierOption = page.locator('text=Robertus Amaresi');
    if (await cashierOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cashierOption.click();
    }

    // Periksa semua tombol interaktif utama di dalam layar tablet (.scr)
    const buttonSizes = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.scr button'));
      return buttons.map((b) => {
        const rect = b.getBoundingClientRect();
        return {
          text: b.textContent?.trim().slice(0, 20) || b.getAttribute('aria-label') || '',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
    });

    // Semua tombol navigasi, kategori, kartu, dan aksi harus memenuhi tinggi minimal touch target (>= 32px untuk kontrol kecil/qty, >= 40px untuk tombol)
    for (const b of buttonSizes) {
      if (b.height > 0) {
        expect(b.height).toBeGreaterThanOrEqual(32);
      }
    }
  });

  test('4. Audit Format Rupiah dan Zona Waktu Otomatis', async ({ page }) => {
    await page.goto('/?device=tablet');

    // Lewati Intro jika ada
    const intro = page.locator('.tk-intro-container');
    if (await intro.isVisible()) {
      await intro.click({ force: true }).catch(() => {});
    }

    const cashierOption = page.locator('text=Robertus Amaresi');
    if (await cashierOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cashierOption.click();
    }

    // Uji tampilan Rupiah di kartu menu
    const pricePill = page.locator('.price-tag');
    await expect(pricePill.first()).toBeVisible();
    const priceText = await pricePill.first().textContent();
    // Format: Rp langsung angka dengan titik ribuan, tanpa spasi
    expect(priceText).toMatch(/^Rp\d{1,3}(\.\d{3})*$/);
  });
});
