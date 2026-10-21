import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './client.ts';

describe('Supabase Skema & Seed Data Audit', () => {
  const schemaPath = path.resolve(__dirname, '../../../supabase/migrations/001_initial_schema.sql');
  const seedPath = path.resolve(__dirname, '../../../supabase/seed.sql');

  it('berkas migrasi 001_initial_schema.sql harus ada dan memuat seluruh tabel', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    // Cek tabel-tabel utama
    expect(sql).toContain('create table if not exists public.shops');
    expect(sql).toContain('create type public.member_role');
    expect(sql).toContain('create table if not exists public.shop_members');
    expect(sql).toContain('create table if not exists public.cashiers');
    expect(sql).toContain('create table if not exists public.menu_groups');
    expect(sql).toContain('create table if not exists public.menu_items');
    expect(sql).toContain('create table if not exists public.orders');
    expect(sql).toContain('create table if not exists public.order_items');
    expect(sql).toContain('create table if not exists public.devices');
  });

  it('berkas migrasi harus memuat fungsi keamanan dan RLS di semua tabel', () => {
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    expect(sql).toContain('create or replace function public.is_member');
    expect(sql).toContain('create or replace function public.is_owner');
    expect(sql).toContain('alter table public.shops enable row level security;');
    expect(sql).toContain('alter table public.menu_items enable row level security;');
    expect(sql).toContain('alter table public.orders enable row level security;');
  });

  it('berkas migrasi harus memuat RPC create_order, set_item_availability, dan add_cashier', () => {
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    expect(sql).toContain('create or replace function public.create_order');
    expect(sql).toContain('create or replace function public.set_item_availability');
    expect(sql).toContain('create or replace function public.add_cashier');
  });

  it('berkas migrasi harus memiliki view best_sellers dan trigger maksimal 7 item', () => {
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    expect(sql).toContain('create or replace view public.best_sellers');
    expect(sql).toContain('create or replace function public.check_max_items_per_group');
    expect(sql).toContain('create trigger trg_check_max_items_per_group');
  });

  it('berkas seed.sql harus memuat toko Makassar, kasir, dan menu dengan harga integer rupiah', () => {
    expect(fs.existsSync(seedPath)).toBe(true);
    const sql = fs.readFileSync(seedPath, 'utf-8');

    expect(sql).toContain("'Tati’e Kitchen'");
    expect(sql).toContain("'Asia/Makassar'");
    expect(sql).toContain("'Robertus Amaresi'");
    expect(sql).toContain("'Puspitawati'");
    expect(sql).toContain("'Kebab'");
    expect(sql).toContain('false'); // status Kebab habis

    // Harga dalam ribuan penuh (contoh: 20000, 40000)
    expect(sql).toContain('20000');
    expect(sql).toContain('40000');

    // Penulisan persis dari HTML
    expect(sql).toContain("'Butterscote Latte Coffee'");
    expect(sql).toContain("'Butterscote Latte'");
    expect(sql).toContain("'Cadburry'");
    expect(sql).toContain("'Roti Jhon'");
    expect(sql).toContain("'Panda Coffee Cream'");
  });

  it('klien Supabase harus terinisialisasi tanpa error', () => {
    expect(supabase).toBeDefined();
    expect(typeof isSupabaseConfigured).toBe('function');
  });
});
