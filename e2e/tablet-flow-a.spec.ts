import { test, expect } from '@playwright/test';

test.describe('Alur Tablet Kasir Bagian A (Viewport 1024 x 640)', () => {
  test.use({ viewport: { width: 1024, height: 640 } });

  test('alur lengkap: Intro -> Pilih Profil -> Tambah Kasir -> Akun -> Tampilan -> Ganti Kasir', async ({ page }) => {
    // 1. Buka tablet mode
    await page.goto('/?device=tablet');

    // 2. Intro Tati'e Kitchen tampil, lewati atau tunggu transisi selesai
    const intro = page.locator('.tk-intro-container');
    if (await intro.isVisible()) {
      await intro.click({ force: true }).catch(() => {});
    }

    // 3. Layar Pilih Profil: "Siapa yang bertugas?"
    await expect(page.locator('h2')).toContainText('Siapa yang bertugas?', { timeout: 10000 });
    await expect(page.locator('text=Robertus Amaresi')).toBeVisible();
    await expect(page.locator('text=Puspitawati')).toBeVisible();

    // 4. Tambah Kasir baru
    const addBtn = page.getByRole('button', { name: 'Tambah kasir baru' });
    await addBtn.click();

    const nameInput = page.getByPlaceholder('Nama kasir');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Dewi Sartika');

    const submitBtn = page.getByRole('button', { name: 'Tambah', exact: true });
    await submitBtn.click();

    // 5. Kasir baru terpilih, masuk ke Home tablet
    await expect(page.locator('text=Kasir: Dewi Sartika')).toBeVisible();
    const navbar = page.locator('nav[aria-label="Navigasi Utama"]');
    await expect(navbar).toBeVisible();

    // 6. Pindah ke tab Akun
    const akunNav = page.getByRole('button', { name: 'Akun' });
    await akunNav.click();

    await expect(page.locator('text=Bertugas sejak')).toBeVisible();
    await expect(page.locator('text=Dewi Sartika')).toBeVisible();

    // 7. Buka Sheet Tampilan
    const tampilanBtn = page.getByRole('button', { name: /Tampilan/ });
    await tampilanBtn.click();

    const sheetHeading = page.locator('.tk-sheet >> text=Tampilan');
    await expect(sheetHeading).toBeVisible();

    // Ubah ke mode Terang
    const terangBtn = page.getByRole('button', { name: 'Terang' });
    await terangBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // Ubah ke palet Samudra
    const samudraBtn = page.locator('button[aria-label="Samudra"]');
    await samudraBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'samudra');

    // Tutup sheet tampilan
    const selesaiBtn = page.getByRole('button', { name: 'Selesai' });
    await selesaiBtn.click();
    await expect(sheetHeading).not.toBeVisible();

    // 8. Klik Ganti Kasir
    const gantiBtn = page.getByRole('button', { name: 'Ganti kasir' });
    await gantiBtn.click();

    // Kembali ke layar Pilih Profil
    await expect(page.locator('h2')).toContainText('Siapa yang bertugas?');
    await expect(page.locator('text=Dewi Sartika')).toBeVisible();
  });
});
