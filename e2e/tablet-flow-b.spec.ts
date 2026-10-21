import { test, expect } from '@playwright/test';

test.describe('Alur Tablet Kasir Bagian B (Viewport 1024 x 640)', () => {
  test.use({ viewport: { width: 1024, height: 640 } });

  test('alur transaksi lengkap: Home -> Menu Lengkap -> Keranjang -> Meja & Bayar -> Struk -> Pesanan Baru -> Riwayat', async ({ page }) => {
    // 1. Buka tablet mode
    await page.goto('/?device=tablet');

    // 2. Lewati Intro dan pilih kasir
    const intro = page.locator('.tk-intro-container');
    if (await intro.isVisible()) {
      await intro.click({ force: true }).catch(() => {});
    }

    // Tunggu layar pilih kasir
    await expect(page.locator('h2')).toContainText('Siapa yang bertugas?', { timeout: 10000 });

    // Pilih Robertus Amaresi
    const cashierOption = page.locator('text=Robertus Amaresi');
    await expect(cashierOption).toBeVisible();
    await cashierOption.click();

    // 3. Masuk ke Layar Home
    await expect(page.locator('h2')).toContainText('Tati’e Kitchen');
    await expect(page.locator('text=Kasir: Robertus Amaresi')).toBeVisible();

    // 4. Uji Menu Lengkap Pembeli (Golden Triangle)
    const menuLengkapBtn = page.getByRole('button', { name: 'Menu lengkap' });
    await expect(menuLengkapBtn).toBeVisible();
    await menuLengkapBtn.click();

    const customerMenuDialog = page.getByRole('dialog', { name: 'Menu Lengkap Pembeli' });
    await expect(customerMenuDialog).toBeVisible();
    await expect(page.locator('text=Terlaris')).toBeVisible();

    const tutupMenuBtn = page.getByRole('button', { name: 'Tutup' });
    await tutupMenuBtn.click();
    await expect(customerMenuDialog).not.toBeVisible();

    // 5. Tambah item ke keranjang
    const mieCard = page.getByRole('button', { name: /Mie Goreng Komplit/i });
    await expect(mieCard).toBeVisible();
    await mieCard.click();

    // Verifikasi keranjang terisi
    await expect(page.locator('text=Pesanan (1)')).toBeVisible();

    // Tambah kuantitas dengan tombol +
    const tambahBtn = page.getByRole('button', { name: 'Tambah Mie Goreng Komplit' });
    await tambahBtn.click();
    await expect(page.locator('text=Pesanan (2)')).toBeVisible();

    // 6. Lanjut ke Meja & Pembayaran (Tombol Lime)
    const lanjutBayarBtn = page.getByRole('button', { name: 'Lanjut ke meja & bayar' });
    await expect(lanjutBayarBtn).toBeVisible();
    await lanjutBayarBtn.click();

    // 7. Layar Bayar Tunai & Keypad Meja
    await expect(page.locator('text=Nomor meja')).toBeVisible();
    await expect(page.locator('text=Pembayaran tunai')).toBeVisible();

    // Pilih meja menggunakan keypad
    const key5 = page.getByRole('button', { name: '5', exact: true });
    await key5.click();

    // Selesaikan pembayaran
    const selesaikanBtn = page.getByRole('button', { name: 'Selesaikan pembayaran' });
    await expect(selesaikanBtn).toBeVisible();
    await selesaikanBtn.click();

    // 8. Layar Struk & Bukti Bayar
    await expect(page.locator('text=Pembayaran berhasil')).toBeVisible();
    await expect(page.locator('text=Jl. Tamalate 2 No. 8, Makassar')).toBeVisible();

    // Verifikasi tombol Bagikan dan Unduh PNG ada
    await expect(page.getByRole('button', { name: 'Bagikan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unduh PNG' })).toBeVisible();

    // 9. Pesanan Baru (Tombol Lime)
    const pesananBaruBtn = page.getByRole('button', { name: 'Pesanan baru' });
    await expect(pesananBaruBtn).toBeVisible();
    await pesananBaruBtn.click();

    // Kembali ke Home dengan keranjang bersih
    await expect(page.locator('text=Pesanan (0)')).toBeVisible();

    // 10. Buka Riwayat Transaksi via Navbar
    const riwayatNav = page.getByRole('button', { name: 'Riwayat' });
    await riwayatNav.click();

    await expect(page.locator('h2')).toContainText('Riwayat Transaksi');
    const rangeBtn = page.getByRole('button', { name: 'Pilih rentang waktu' });
    await expect(rangeBtn).toBeVisible();
    await rangeBtn.click();

    // Sheet rentang waktu muncul
    await expect(page.locator('text=Pilih rentang waktu')).toBeVisible();
    const terapkanBtn = page.getByRole('button', { name: 'Terapkan' });
    await terapkanBtn.click();
  });
});
