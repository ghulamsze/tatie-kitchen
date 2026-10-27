import React, { useState, useMemo } from 'react';
import { useMenuStore } from '../../../stores/menuStore.ts';
import { formatRupiah } from '../../../lib/format/formatters.ts';
import { MenuItem } from '../../../lib/supabase/types.ts';
import { triggerHapticFeedback } from '../../../lib/device/haptics.ts';

function formatThousands(value: number | string): string {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseThousands(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export const PhoneMenuScreen: React.FC = () => {
  const { items, groups, selectedCategory, setCategory, toggleItemAvailability, updateMenuItem, addMenuItem } = useMenuStore();

  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form edit
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editPriceStr, setEditPriceStr] = useState('0');
  const [editAvailable, setEditAvailable] = useState(true);
  const [editGroupId, setEditGroupId] = useState('');

  // Form tambah
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState(15000);
  const [addPriceStr, setAddPriceStr] = useState('15.000');
  const [addAvailable, setAddAvailable] = useState(true);
  const [addGroupId, setAddGroupId] = useState(groups[0]?.id || 'g-makanan-1');

  // Daftar kategori chip
  const categories = useMemo(() => {
    return ['Semua', 'Makanan', 'Mie', 'Snack', 'Minuman'];
  }, []);

  // Filter items sesuai kategori dan pencarian
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter kategori
      if (selectedCategory !== 'Semua') {
        const itemCat = (item as any).category?.toLowerCase();
        const selCat = selectedCategory.toLowerCase();
        if (itemCat && itemCat !== selCat) {
          // Cek via group
          const grp = groups.find((g) => g.id === item.group_id);
          if (grp && grp.category.toLowerCase() !== selCat) {
            return false;
          }
        }
      }

      // Filter pencarian
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return item.name.toLowerCase().includes(q);
      }

      return true;
    });
  }, [items, selectedCategory, search, groups]);

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditPrice(item.price_idr);
    setEditPriceStr(formatThousands(item.price_idr));
    setEditAvailable(item.available);
    setEditGroupId(item.group_id);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const trimmed = editName.trim();
    if (!trimmed) return;

    await updateMenuItem({
      id: editingItem.id,
      name: trimmed,
      price_idr: Number(editPrice) || 0,
      available: editAvailable,
      group_id: editGroupId,
    });
    setEditingItem(null);
  };

  const handleSaveAdd = async () => {
    const trimmed = addName.trim();
    if (!trimmed) return;

    const selectedGroup = groups.find((g) => g.id === addGroupId) || groups[0];

    await addMenuItem({
      name: trimmed,
      price_idr: Number(addPrice) || 0,
      available: addAvailable,
      group_id: addGroupId,
      category: selectedGroup ? selectedGroup.category : 'makanan',
      photo_path: null,
      sort: items.length + 1,
    } as any);

    setAddName('');
    setAddPrice(15000);
    setAddPriceStr('15.000');
    setAddAvailable(true);
    setIsAddOpen(false);
  };

  return (
    <div className="tk-phone-screen" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header Judul & Tombol Tambah Menu */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '0 4px 12px',
          flexShrink: 0,
        }}
      >
        <h1 className="tk-phone-title" style={{ margin: 0 }}>
          Menu
        </h1>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          aria-label="Tambah menu baru"
          title="Tambah menu baru"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            fontSize: '22px',
            lineHeight: 1,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: 'var(--sh-sm)',
            transition: 'transform 0.1s ease',
          }}
        >
          +
        </button>
      </div>

      {/* 2. Pencarian Menu Sama Persis dengan Tablet */}
      <div style={{ margin: '0 4px 12px', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          className="tk-input"
          placeholder="Cari menu"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            height: '44px',
            padding: search ? '0 44px 0 16px' : '0 16px',
            fontSize: 'var(--t-sm)',
            borderRadius: 'var(--r-md)',
            boxSizing: 'border-box',
          }}
          aria-label="Cari menu"
        />
        {search.length > 0 && (
          <button
            type="button"
            onClick={() => setSearch('')}
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

      {/* 3. Bar Chip Kategori (Sama dengan Tablet, Semua Kategori Tampil Rapi Tanpa Terpotong) */}
      <div
        className="tk-category-nav tk-chips-bar"
        style={{
          display: 'flex',
          gap: '6px',
          width: '100%',
          padding: '0 4px 12px',
          margin: 0,
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              className={`tk-chip ${isSelected ? 'active lime' : ''}`}
              onClick={() => setCategory(cat)}
              aria-pressed={isSelected}
              style={{
                flex: 1,
                minWidth: 0,
                height: '36px',
                padding: '0 4px',
                fontSize: '12px',
                lineHeight: '36px',
                fontWeight: isSelected ? 800 : 700,
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 4. Daftar Kartu Menu Kafe */}
      <div
        className="tk-custom-slider"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '2px',
          paddingBottom: '88px', // Ruang untuk navbar pill
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: 'var(--ink-3)',
            }}
          >
            <p style={{ margin: 0, fontSize: 'var(--t-sm)', fontWeight: 600 }}>
              Tidak ada menu ditemukan.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isAvailable = item.available;

            return (
              <div
                key={item.id}
                className="g-acrylic"
                onClick={() => handleOpenEdit(item)}
                role="button"
                tabIndex={0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-lg)',
                  gap: '12px',
                  cursor: 'pointer',
                  opacity: isAvailable ? 1 : 0.6,
                  filter: isAvailable ? 'none' : 'grayscale(100%)',
                  transition: 'opacity 0.2s ease, filter 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Thumbnail Gambar / Icon SVG Menu */}
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ctl)',
                    border: '1px solid var(--ctl-line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {item.photo_path ? (
                    <img
                      src={item.photo_path}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--ink-3)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="1" x2="6" y2="4" />
                      <line x1="10" y1="1" x2="10" y2="4" />
                      <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  )}
                </div>

                {/* Deskripsi Nama & Harga */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span
                    style={{
                      fontSize: 'var(--t-sm)',
                      lineHeight: 'var(--l-sm)',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--t-xs)',
                      lineHeight: 'var(--l-xs)',
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}
                  >
                    {formatRupiah(item.price_idr)}
                  </span>
                </div>

                {/* Liquid Toggle Ketersediaan Menu */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHapticFeedback([25]);
                    toggleItemAvailability(item.id, !isAvailable);
                  }}
                  aria-label={isAvailable ? 'Tandai habis' : 'Tandai tersedia'}
                  title={isAvailable ? 'Klik untuk tandai habis' : 'Klik untuk tandai tersedia'}
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: 'var(--r-pill)',
                    background: isAvailable ? 'var(--accent)' : 'var(--ctl-line)',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: 'var(--r-pill)',
                      background: '#ffffff',
                      transform: isAvailable ? 'translateX(20px)' : 'translateX(0px)',
                      transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: 'var(--sh-sm)',
                    }}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Dialog Ubah Detail Menu */}
      {editingItem && (
        <div
          className="tk-phone-overlay ov"
          onClick={() => setEditingItem(null)}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="g-liquid tk-phone-sheet sh"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <b
              style={{
                fontSize: 'var(--t-lg)',
                lineHeight: 'var(--l-lg)',
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Ubah Detail Menu
            </b>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--ink-3)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Nama Menu
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ctl)',
                    border: '1px solid var(--ctl-line)',
                    color: 'var(--ink)',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--ink-3)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Harga Jual
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ctl)',
                    border: '1px solid var(--ctl-line)',
                    boxSizing: 'border-box',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--t-sm)',
                      fontWeight: 800,
                      color: 'var(--ink-2)',
                      userSelect: 'none',
                    }}
                  >
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editPriceStr}
                    placeholder="0"
                    onChange={(e) => {
                      const formatted = formatThousands(e.target.value);
                      setEditPriceStr(formatted);
                      setEditPrice(parseThousands(formatted));
                    }}
                    style={{
                      flex: 1,
                      height: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--ink)',
                      fontSize: 'var(--t-sm)',
                      fontWeight: 700,
                      outline: 'none',
                      padding: 0,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--ink-3)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Kategori
                </label>
                <select
                  value={editGroupId}
                  onChange={(e) => setEditGroupId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ctl)',
                    border: '1px solid var(--ctl-line)',
                    color: 'var(--ink)',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id} style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--ctl)',
                  border: '1px solid var(--ctl-line)',
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--t-sm)', fontWeight: 800, color: 'var(--ink)' }}>
                    Status Ketersediaan
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-3)', fontWeight: 600 }}>
                    {editAvailable ? 'Tersedia untuk dipesan' : 'Habis (Stok Kosong)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAvailable(!editAvailable)}
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: 'var(--r-pill)',
                    background: editAvailable ? 'var(--accent)' : 'var(--ctl-line)',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: 'var(--r-pill)',
                      background: '#ffffff',
                      transform: editAvailable ? 'translateX(20px)' : 'translateX(0px)',
                      transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="tk-btn-flat"
                  onClick={() => setEditingItem(null)}
                  style={{ flex: 1, height: '44px' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="tk-btn-lime"
                  onClick={handleSaveEdit}
                  style={{ flex: 1, height: '44px' }}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Dialog Tambah Menu Baru */}
      {isAddOpen && (
        <div
          className="tk-phone-overlay ov"
          onClick={() => setIsAddOpen(false)}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="g-liquid tk-phone-sheet sh"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <b
              style={{
                fontSize: 'var(--t-lg)',
                lineHeight: 'var(--l-lg)',
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Tambah Menu Baru
            </b>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--ink-3)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Nama Menu
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kopi Susu Aren"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ctl)',
                    border: '1px solid var(--ctl-line)',
                    color: 'var(--ink)',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--ink-3)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Harga Jual
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ctl)',
                    border: '1px solid var(--ctl-line)',
                    boxSizing: 'border-box',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--t-sm)',
                      fontWeight: 800,
                      color: 'var(--ink-2)',
                      userSelect: 'none',
                    }}
                  >
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={addPriceStr}
                    placeholder="0"
                    onChange={(e) => {
                      const formatted = formatThousands(e.target.value);
                      setAddPriceStr(formatted);
                      setAddPrice(parseThousands(formatted));
                    }}
                    style={{
                      flex: 1,
                      height: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--ink)',
                      fontSize: 'var(--t-sm)',
                      fontWeight: 700,
                      outline: 'none',
                      padding: 0,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--ink-3)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Kategori Menu
                </label>
                <select
                  value={addGroupId}
                  onChange={(e) => setAddGroupId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ctl)',
                    border: '1px solid var(--ctl-line)',
                    color: 'var(--ink)',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id} style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--ctl)',
                  border: '1px solid var(--ctl-line)',
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--t-sm)', fontWeight: 800, color: 'var(--ink)' }}>
                    Status Ketersediaan
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-3)', fontWeight: 600 }}>
                    {addAvailable ? 'Tersedia untuk dipesan' : 'Habis (Stok Kosong)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddAvailable(!addAvailable)}
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: 'var(--r-pill)',
                    background: addAvailable ? 'var(--accent)' : 'var(--ctl-line)',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: 'var(--r-pill)',
                      background: '#ffffff',
                      transform: addAvailable ? 'translateX(20px)' : 'translateX(0px)',
                      transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="tk-btn-flat"
                  onClick={() => setIsAddOpen(false)}
                  style={{ flex: 1, height: '44px' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="tk-btn-lime"
                  onClick={handleSaveAdd}
                  style={{ flex: 1, height: '44px' }}
                >
                  Tambah Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneMenuScreen;
