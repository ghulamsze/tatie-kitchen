import { describe, it, expect, beforeEach } from 'vitest';
import { useShopStore, DEFAULT_SHOP_SETTINGS } from './shopStore.ts';
import fs from 'node:fs';
import path from 'node:path';

describe('Shop Store & Platform Schema Preparation (Fase 6)', () => {
  beforeEach(() => {
    useShopStore.setState({ shop: DEFAULT_SHOP_SETTINGS, isLoading: false });
    localStorage.clear();
  });

  it('harus memuat informasi default toko resmi yang telah dikonfirmasi pemilik', () => {
    const shop = useShopStore.getState().shop;
    expect(shop.name).toBe("Tati’e Kitchen");
    expect(shop.bank_name).toBe('Bank Kaltimtara');
    expect(shop.bank_account).toBe('1747037252');
    expect(shop.bank_account_holder).toBe('Hartati Jahri');
    expect(shop.timezone).toBe('Asia/Makassar');
    expect(shop.qris_path).toBe('/assets/images/qris-clean.png');
  });

  it('harus dapat memperbarui pengaturan toko lokal', () => {
    useShopStore.getState().updateShopSettings({
      phone_no: '0812-9999-8888',
      address: 'Cabang Baru, Tarakan',
    });

    const updated = useShopStore.getState().shop;
    expect(updated.phone_no).toBe('0812-9999-8888');
    expect(updated.address).toBe('Cabang Baru, Tarakan');
    expect(updated.bank_account).toBe('1747037252'); // tidak berubah
  });

  it('memastikan berkas migrasi 003_shop_settings.sql memuat kolom rekening dan RLS', () => {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/003_shop_settings.sql');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('alter table public.shops');
    expect(sql).toContain('bank_name');
    expect(sql).toContain('bank_account');
    expect(sql).toContain('bank_account_holder');
    expect(sql).toContain('qris_path');
    expect(sql).toContain('Hanya owner yang dapat mengubah informasi toko');
  });

  it('memastikan berkas migrasi 004_owner_rpcs.sql memuat stub RPC untuk laptop admin', () => {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/004_owner_rpcs.sql');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('function public.get_sales_report');
    expect(sql).toContain('function public.update_menu_item');
    expect(sql).toContain('function public.deactivate_cashier');
    expect(sql).toContain('security definer');
  });
});
