import React, { useMemo, useState, useRef } from 'react';
import { useMenuStore } from '../../stores/menuStore.ts';
import { useCartStore } from '../../stores/cartStore.ts';
import { MenuCard } from './MenuCard.tsx';
import { Button } from '../../design/components/Button.tsx';
import { Toast } from '../../design/components/Toast.tsx';
import { formatRupiah } from '../../lib/format/formatters.ts';
import { SnapDust } from '../../lib/effects/snapDust.ts';

export interface HomeScreenProps {
  onOpenCustomerMenu: () => void;
  onProceedToPayment: () => void;
  onChangeCashier?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = React.memo(({
  onOpenCustomerMenu,
  onProceedToPayment,
  onChangeCashier: _onChangeCashier,
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const touchStartXRef = useRef<number | null>(null);

  const {
    items,
    selectedCategory,
    setCategory,
    searchQuery,
    setSearchQuery,
    heldItem,
    setHeldItem,
    toastMessage,
  } = useMenuStore();

  const {
    lines,
    addItem,
    updateQty,
    clearCart,
    calculateTotal,
    notes,
    setNotes,
  } = useCartStore();

  const cartContainerRef = useRef<HTMLDivElement>(null);

  const isItemFarBelow = (itemId: string, el: HTMLElement): boolean => {
    // 1. Jika pesanan banyak (> 4 item) dan posisi item di urutan bawah (index >= 3)
    if (lines.length > 4) {
      const idx = lines.findIndex((l) => l.item.id === itemId);
      if (idx >= 3) return true;
    }
    // 2. Jika elemen berada di luar atau di dekat batas bawah area scroll keranjang
    if (cartContainerRef.current) {
      const elRect = el.getBoundingClientRect();
      const containerRect = cartContainerRef.current.getBoundingClientRect();
      if (elRect.bottom > containerRect.bottom - 16 || elRect.top < containerRect.top) {
        return true;
      }
    }
    return false;
  };

  const handleClearCart = async () => {
    if (lines.length === 0) return;
    // Jika pesanan banyak (> 4 item), hindari animasi snapdust berat dan bersihkan langsung
    if (lines.length > 4) {
      clearCart();
      return;
    }
    setIsClearing(true);
    const promises = lines.map((line) => {
      const el = rowRefs.current.get(line.item.id);
      if (el && !isItemFarBelow(line.item.id, el)) {
        return SnapDust.disintegrate(el, {
          duration: 480,
          direction: 'ltr',
          wind: { x: 1.4, y: -0.5 },
        });
      }
      return Promise.resolve();
    });
    await Promise.all(promises);
    clearCart();
    setIsClearing(false);
  };

  const handleMinusQty = async (itemId: string, currentQty: number) => {
    if (currentQty <= 1) {
      const el = rowRefs.current.get(itemId);
      // Hindari snapdust jika pesanan di bawah banget atau pesanan banyak
      if (el && !isItemFarBelow(itemId, el)) {
        await SnapDust.disintegrate(el, {
          duration: 480,
          direction: 'ltr',
          wind: { x: 1.4, y: -0.5 },
        });
      }
      updateQty(itemId, -1);
    } else {
      updateQty(itemId, -1);
    }
  };


  const categories = [
    { key: 'Semua', label: 'Semua' },
    { key: 'Snack', label: 'Snack' },
    { key: 'Makanan', label: 'Makanan' },
    { key: 'Mie', label: 'Mie' },
    { key: 'Minuman', label: 'Minuman' },
  ];

  // Filter items berdasarkan kategori dan pencarian
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Kategori
      if (selectedCategory !== 'Semua') {
        const catLower = selectedCategory.toLowerCase();
        if (catLower === 'makanan' && !item.group_id.includes('makanan')) return false;
        if (catLower === 'mie' && !item.group_id.includes('mie')) return false;
        if (catLower === 'snack' && !item.group_id.includes('snack')) return false;
        if (catLower === 'minuman' && !item.group_id.includes('minuman')) return false;
      }
      // 2. Query pencarian
      if (searchQuery.trim().length > 0) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  const total = calculateTotal();

  return (
    <div
      className="scr"
      style={{
        width: '1024px',
        height: '640px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        padding: '20px 24px 84px 24px',
      }}
    >
      {/* 2. Area Konten Utama: Katalog Menu (Kiri) + Keranjang Pesanan (Kanan) */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Sisi Kiri: Header Brand + Cari Menu + Chip Kategori + Grid Kartu Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '12px' }}>
          {/* Header Brand & Menu Lengkap */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flex: 'none',
            }}
          >
            <h2 style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Tati’e Kitchen
            </h2>
            <Button
              variant="flat"
              size="md"
              onClick={onOpenCustomerMenu}
              style={{ minHeight: '40px', height: '40px', padding: '0 16px', fontSize: 'var(--t-sm)', boxSizing: 'border-box' }}
            >
              Menu lengkap
            </Button>
          </div>

          {/* Input Pencarian Menu Persis Sesuai Gambar Referensi */}
          <div style={{ flex: 'none', width: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="tk-input"
              placeholder="Cari menu"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: searchQuery ? '0 46px 0 16px' : '0 16px',
                fontSize: 'var(--t-sm)',
                borderRadius: 'var(--r-md)',
                boxSizing: 'border-box',
              }}
              aria-label="Cari menu"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus teks pencarian"
                title="Hapus pencarian"
                style={{
                  position: 'absolute',
                  right: '4px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.16)',
                  color: 'var(--ink)',
                  border: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'background 0.15s ease',
                }}
              >
                ✕
              </button>
            )}
          </div>
          {/* Chip Kategori */}
          <div style={{ display: 'flex', gap: '8px', flex: 'none', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`tk-chip ${selectedCategory === cat.key ? 'active lime' : ''}`}
                onClick={() => setCategory(cat.key)}
                aria-pressed={selectedCategory === cat.key}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid Kartu Menu dengan Dukungan Swipe Horizontal Antar Kategori */}
          <div
            className="tk-menu-grid"
            onTouchStart={(e) => {
              touchStartXRef.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null) return;
              const diff = e.changedTouches[0].clientX - touchStartXRef.current;
              touchStartXRef.current = null;
              if (Math.abs(diff) > 40) {
                const keys = ['Semua', 'Snack', 'Makanan', 'Mie', 'Minuman'];
                const curIdx = keys.indexOf(selectedCategory);
                if (diff < 0 && curIdx < keys.length - 1) {
                  setCategory(keys[curIdx + 1]);
                } else if (diff > 0 && curIdx > 0) {
                  setCategory(keys[curIdx - 1]);
                }
              }
            }}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              paddingRight: '4px',
              alignContent: 'start',
            }}
          >
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                isHeld={heldItem?.id === item.id}
                onAdd={(it) => addItem(it)}
                onHold={(it) => setHeldItem(it)}
              />
            ))}
            {filteredItems.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '48px 0',
                  color: 'var(--ink-3)',
                }}
              >
                Tidak ada menu yang sesuai pencarian.
              </div>
            )}
          </div>
        </div>

        {/* Sisi Kanan: Panel Keranjang Pesanan */}
        <div
          className="g-acrylic tk-cart-panel"
          style={{
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Keranjang */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 'none' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800 }}>
              Pesanan baru
            </h3>
            {lines.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                disabled={isClearing}
                style={{
                  minHeight: '44px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: 'var(--t-xs)',
                  fontWeight: 700,
                  cursor: isClearing ? 'not-allowed' : 'pointer',
                  padding: '0 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  opacity: isClearing ? 0.6 : 1,
                  transition: 'opacity 0.15s ease',
                }}
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Daftar Item Keranjang */}
          <div
            ref={cartContainerRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px',
            }}
          >
            {lines.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--ink-3)',
                  textAlign: 'center',
                  padding: '16px',
                }}
              >
                <span style={{ fontSize: 'var(--t-sm)' }}>Keranjang masih kosong</span>
                <small style={{ fontSize: 'var(--t-xs)', marginTop: '4px' }}>
                  Ketuk kartu menu untuk menambah pesanan
                </small>
              </div>
            ) : (
              lines.map((line) => (
                <div
                  key={line.item.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(line.item.id, el);
                    else rowRefs.current.delete(line.item.id);
                  }}
                  className="tk-cart-row tk-cart-item-in"
                >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>

                      <b style={{ display: 'block', fontSize: 'var(--t-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {line.item.name}
                      </b>
                      <span style={{ color: 'var(--ink-2)', fontSize: 'var(--t-xs)' }}>
                        {formatRupiah(line.item.price_idr)}
                      </span>
                    </div>
                    <div className="tk-qty-control" style={{ gap: '8px' }}>
                      <button
                        type="button"
                        className="tk-qty-btn"
                        onClick={() => handleMinusQty(line.item.id, line.qty)}
                        style={{ width: '32px', height: '32px', fontSize: '18px' }}
                        aria-label={`Kurangi ${line.item.name}`}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 700, fontSize: 'var(--t-sm)' }}>
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        className="tk-qty-btn"
                        onClick={() => addItem(line.item)}
                        style={{ width: '32px', height: '32px', fontSize: '18px' }}
                        aria-label={`Tambah ${line.item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Kolom Catatan Pesanan dengan Tombol X - Sesuai permintaan */}
          <div style={{ flex: 'none', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="tk-input tk-notes-input"
              placeholder="Catatan: kurang pedas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                height: '40px',
                fontSize: 'var(--t-xs)',
                padding: notes.length > 0 ? '0 38px 0 12px' : '0 12px',
                width: '100%',
              }}
              aria-label="Catatan pesanan"
            />
            {notes.length > 0 && (
              <button
                type="button"
                onClick={() => setNotes('')}
                aria-label="Hapus catatan"
                title="Hapus catatan"
                style={{
                  position: 'absolute',
                  right: '4px',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.16)',
                  color: 'var(--ink)',
                  border: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'background 0.15s ease',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Total & Tombol Lime Pembayaran */}
          <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgb(var(--w) / 0.16)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', fontWeight: 800 }}>
                {formatRupiah(total)}
              </span>
            </div>

            {/* Exactly ONE lime button per screen rule */}
            <Button
              variant="lime"
              onClick={onProceedToPayment}
              disabled={lines.length === 0}
              style={{ width: '100%' }}
            >
              Lanjut ke meja & bayar
            </Button>
          </div>
        </div>
      </div>

      {/* Toast Notifikasi Feedback Status */}
      {toastMessage && (
        <div style={{ position: 'absolute', bottom: '88px', left: '50%', transform: 'translateX(-50%)', zIndex: 120 }}>
          <Toast message={toastMessage} />
        </div>
      )}
    </div>
  );
});
