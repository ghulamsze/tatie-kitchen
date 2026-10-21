import { test } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/lenovo/.gemini/antigravity-ide/brain/47799406-a09b-4c97-8c08-828ce8be071f';

test.describe('Tangkapan Layar Fase 5 Tablet Kasir', () => {
  test.use({ viewport: { width: 1024, height: 640 } });

  test('mengambil screenshot semua layar Fase 5', async ({ page }) => {
    // 1. Buka tablet mode
    await page.goto('/?device=tablet');

    // Lewati Intro jika ada
    const intro = page.locator('.tk-intro-container');
    if (await intro.isVisible()) {
      await intro.click({ force: true }).catch(() => {});
    }

    // Pilih kasir Robertus Amaresi jika di layar pilih profil
    const cashierOption = page.locator('text=Robertus Amaresi');
    if (await cashierOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cashierOption.click();
    }

    await page.waitForTimeout(500);

    // SCREENSHOT 1: Home Screen (Katalog Menu & Keranjang)
    // Tambah 2 item agar keranjang terisi cantik
    const mieCard = page.getByRole('button', { name: /Mie Goreng Komplit/i });
    if (await mieCard.isVisible()) {
      await mieCard.click();
      await page.waitForTimeout(200);
      const kopiCard = page.getByRole('button', { name: /Kopi Susu/i });
      if (await kopiCard.isVisible()) {
        await kopiCard.click();
      }
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fase5_home_screen.png') });

    // SCREENSHOT 2: Customer Menu View (Golden Triangle Terlaris)
    const menuLengkapBtn = page.getByRole('button', { name: 'Menu lengkap' });
    await menuLengkapBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fase5_customer_menu.png') });

    // Tutup menu lengkap
    const tutupBtn = page.getByRole('button', { name: 'Tutup' });
    await tutupBtn.click();
    await page.waitForTimeout(300);

    // SCREENSHOT 3: Layar Pembayaran (Keypad Meja & Tunai)
    const bayarBtn = page.getByRole('button', { name: 'Lanjut ke meja & bayar' });
    await bayarBtn.click();
    await page.waitForTimeout(400);

    // Ketik meja 4
    const key4 = page.getByRole('button', { name: '4', exact: true });
    if (await key4.isVisible()) {
      await key4.click();
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fase5_payment_screen.png') });

    // SCREENSHOT 4: Layar Struk & Bukti Pembayaran
    const selesaikanBtn = page.getByRole('button', { name: 'Selesaikan pembayaran' });
    await selesaikanBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fase5_receipt_screen.png') });

    // SCREENSHOT 5: Layar Riwayat Transaksi
    const pesananBaruBtn = page.getByRole('button', { name: 'Pesanan baru' });
    await pesananBaruBtn.click();
    await page.waitForTimeout(300);

    const riwayatNav = page.getByRole('button', { name: 'Riwayat' });
    await riwayatNav.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fase5_history_screen.png') });
  });
});
