import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useMenuStore } from '../../../stores/menuStore.ts';
import { formatRupiah } from '../../../lib/format/formatters.ts';
import { MenuItem } from '../../../lib/supabase/types.ts';
import { triggerHapticFeedback, triggerHapticDelete, triggerHapticReject } from '../../../lib/device/haptics.ts';
import { CropProfileDialog } from '../../../features/akun/CropProfileDialog.tsx';
import { registerBackHandler } from '../../../lib/device/backButton.ts';
import { PhotoActionsDialog } from '../../../design/components/PhotoActionsDialog.tsx';
import { MenuDetailModal } from '../../../features/menu/MenuDetailModal.tsx';

function formatThousands(value: number | string): string {
  // Hanya ambil digit numerik dan buang leading zeros di awal (hanya menerima 1-9 di posisi awal)
  const digits = String(value).replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseThousands(value: string): number {
  const digits = String(value).replace(/\D/g, '').replace(/^0+/, '');
  return digits ? parseInt(digits, 10) : 0;
}

interface CategoryDropdownProps {
  label: string;
  selectedGroupId: string;
  groups: { id: string; name: string }[];
  onSelectGroup: (groupId: string) => void;
  direction?: 'down' | 'up';
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  label,
  selectedGroupId,
  groups,
  onSelectGroup,
  direction = 'down',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Urutkan grup secara alfabetis A-Z sesuai instruksi
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [groups]);

  const selectedGroup = sortedGroups.find((g) => g.id === selectedGroupId) || sortedGroups[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside as any);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside as any);
    };
  }, [isOpen]);

  const isUp = direction === 'up';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
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
        {label}
      </label>

      {/* Trigger Button Liquid Glass */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          height: '42px',
          padding: '0 12px',
          borderRadius: 'var(--r-md)',
          background: 'var(--ctl)',
          border: isOpen ? '1.5px solid var(--accent)' : '1px solid var(--ctl-line)',
          color: 'var(--ink)',
          fontSize: 'var(--t-sm)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s ease',
        }}
      >
        <span>{selectedGroup?.name || 'Pilih Kategori'}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isUp
              ? (isOpen ? 'rotate(0deg)' : 'rotate(180deg)')
              : (isOpen ? 'rotate(180deg)' : 'rotate(0deg)'),
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: 0.75,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown / Dropup Options Popup (Liquid Glass Pekat & Blur 28px) */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            ...(isUp
              ? { bottom: 'calc(100% + 4px)', top: 'auto' }
              : { top: 'calc(100% + 4px)', bottom: 'auto' }),
            left: 0,
            right: 0,
            zIndex: 60,
            background: 'color-mix(in srgb, var(--fl-bg) 96%, #000 4%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--ctl-line)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px',
            animation: 'tk-fade-in 0.15s ease',
          }}
        >
          {sortedGroups.map((g) => {
            const isSelected = g.id === selectedGroupId;
            return (
              <button
                key={g.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectGroup(g.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--r-sm)',
                  background: isSelected ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--ink)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 'var(--t-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                  transition: 'background 0.12s ease',
                }}
              >
                <span>{g.name}</span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface PhoneMenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onToggle: (id: string, newAvailable: boolean) => void;
}

const PhoneMenuItemCard: React.FC<PhoneMenuItemCardProps> = React.memo(({ item, onEdit, onToggle }) => {
  const isAvailable = item.available;
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const didHoldRef = useRef<boolean>(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    hasMovedRef.current = false;
    didHoldRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    holdTimerRef.current = setTimeout(() => {
      if (!hasMovedRef.current) {
        didHoldRef.current = true;
        triggerHapticFeedback([30]);
        onEdit(item);
      }
    }, 450);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMovedRef.current) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      if (dx > 8 || dy > 8) {
        hasMovedRef.current = true;
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasMovedRef.current || didHoldRef.current) {
      e.stopPropagation();
      didHoldRef.current = false;
      return;
    }
    triggerHapticFeedback([15]);
    onEdit(item);
  };

  return (
    <div
      className="g-acrylic tk-phone-menu-card"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="button"
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 14px',
        height: '76px',
        boxSizing: 'border-box',
        borderRadius: 'var(--r-lg)',
        gap: '12px',
        cursor: 'pointer',
        opacity: isAvailable ? 1 : 0.6,
        filter: isAvailable ? 'none' : 'grayscale(100%)',
        transition: 'opacity 0.2s ease, filter 0.2s ease',
        position: 'relative',
        contentVisibility: 'auto',
        containIntrinsicSize: '0 76px',
        contain: 'layout style paint',
        transform: 'translateZ(0)',
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
            loading="lazy"
            decoding="async"
            draggable={false}
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
          onToggle(item.id, !isAvailable);
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
});
PhoneMenuItemCard.displayName = 'PhoneMenuItemCard';

export const PhoneMenuScreen: React.FC = () => {
  const { items, groups, selectedCategory, toggleItemAvailability, addMenuItem } = useMenuStore();

  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form tambah (Harga dimulai kosong 0, foto bersifat opsional)
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState(0);
  const [addPriceStr, setAddPriceStr] = useState('');
  const [addAvailable, setAddAvailable] = useState(true);
  const [addGroupId, setAddGroupId] = useState(groups[0]?.id || 'g-makanan-1');
  const [addPhotoPath, setAddPhotoPath] = useState<string | null>(null);

  useEffect(() => {
    if (groups && groups.length > 0 && (!addGroupId || !groups.some((g) => g.id === addGroupId))) {
      setAddGroupId(groups[0].id);
    }
  }, [groups, addGroupId]);

  // Foto Makanan Crop State (1:1 fixed resolution sesuai profil)
  const [cropFoodImageSrc, setCropFoodImageSrc] = useState<string | null>(null);
  const [isCropFoodOpen, setIsCropFoodOpen] = useState(false);
  const foodFileInputRef = useRef<HTMLInputElement>(null);

  const handleFoodFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropFoodImageSrc(url);
    setIsCropFoodOpen(true);
    e.target.value = '';
  };

  const handleFoodCropComplete = (croppedBlob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAddPhotoPath(dataUrl);
      setIsCropFoodOpen(false);
      if (cropFoodImageSrc) {
        URL.revokeObjectURL(cropFoodImageSrc);
        setCropFoodImageSrc(null);
      }
    };
    reader.readAsDataURL(croppedBlob);
  };

  // State validasi shake reject red (hanya untuk nama & harga wajib)
  const [shakeField, setShakeField] = useState<'name' | 'price' | null>(null);
  const [isPreviewFoodOpen, setIsPreviewFoodOpen] = useState(false);
  const [isPhotoActionsOpen, setIsPhotoActionsOpen] = useState(false);
  const foodHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didTriggerFoodHoldRef = useRef(false);
  const addNameInputRef = useRef<HTMLInputElement>(null);
  const addPriceInputRef = useRef<HTMLInputElement>(null);

  const triggerShake = (field: 'name' | 'price') => {
    setShakeField(field);
    triggerHapticReject();
    setTimeout(() => {
      setShakeField(null);
    }, 600);
  };

  const handlePointerDownFoodPhoto = () => {
    didTriggerFoodHoldRef.current = false;
    if (!addPhotoPath) return;
    foodHoldTimerRef.current = setTimeout(() => {
      didTriggerFoodHoldRef.current = true;
      setIsPreviewFoodOpen(true);
    }, 450);
  };

  const handlePointerUpFoodPhoto = () => {
    if (foodHoldTimerRef.current) {
      clearTimeout(foodHoldTimerRef.current);
      foodHoldTimerRef.current = null;
    }
  };

  const handlePhotoBoxClick = () => {
    if (didTriggerFoodHoldRef.current) {
      didTriggerFoodHoldRef.current = false;
      return;
    }
    if (addPhotoPath) {
      setIsPhotoActionsOpen(true);
    } else {
      foodFileInputRef.current?.click();
    }
  };

  // Tangani tombol ESC pada keyboard (Windows) & Tombol Back hardware/gestur (Android)
  useEffect(() => {
    if (!isCropFoodOpen && !isPreviewFoodOpen && !isPhotoActionsOpen && !isAddOpen) {
      return undefined;
    }

    return registerBackHandler(() => {
      if (isCropFoodOpen) {
        setIsCropFoodOpen(false);
        if (cropFoodImageSrc) {
          URL.revokeObjectURL(cropFoodImageSrc);
          setCropFoodImageSrc(null);
        }
        return true;
      }
      if (isPreviewFoodOpen) {
        setIsPreviewFoodOpen(false);
        return true;
      }
      if (isPhotoActionsOpen) {
        setIsPhotoActionsOpen(false);
        return true;
      }
      if (isAddOpen) {
        setIsAddOpen(false);
        return true;
      }
      return false;
    }, 70);
  }, [isCropFoodOpen, isPreviewFoodOpen, isPhotoActionsOpen, isAddOpen, cropFoodImageSrc]);

  // Filter items sesuai kategori dan pencarian
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Filter kategori
      if (selectedCategory !== 'Semua') {
        const catLower = selectedCategory.toLowerCase();
        const grp = groups.find((g) => g.id === item.group_id);
        const groupCat = grp ? grp.category.toLowerCase() : '';
        const itemCat = ((item as any).category || '').toLowerCase();

        const matches =
          groupCat === catLower ||
          itemCat === catLower ||
          (catLower === 'makanan' && item.group_id.includes('makanan')) ||
          (catLower === 'mie' && item.group_id.includes('mie')) ||
          (catLower === 'pizza' && item.group_id.includes('pizza')) ||
          (catLower === 'roti' && item.group_id.includes('roti')) ||
          (catLower === 'kue' && item.group_id.includes('kue')) ||
          (catLower === 'snack' && item.group_id.includes('snack')) ||
          (catLower === 'minuman' && (item.group_id.includes('minuman') || item.group_id.includes('coffee')));

        if (!matches) return false;
      }

      // 2. Filter pencarian
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return item.name.toLowerCase().includes(q);
      }

      return true;
    });
  }, [items, selectedCategory, search, groups]);

  // Virtualisasi Viewport Culling List Menu
  const ITEM_HEIGHT = 86;
  const OVERSCAN = 3;
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;
    const updateHeight = () => {
      setViewportHeight(container.clientHeight || 600);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [selectedCategory, search]);

  const totalItems = filteredItems.length;
  const totalHeight = totalItems * ITEM_HEIGHT;

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    if (totalItems === 0) {
      return { startIndex: 0, endIndex: 0, offsetY: 0 };
    }
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ITEM_HEIGHT) + (2 * OVERSCAN);
    const end = Math.min(totalItems, start + visibleCount);
    const top = start * ITEM_HEIGHT;
    return { startIndex: start, endIndex: end, offsetY: top };
  }, [scrollTop, viewportHeight, totalItems]);

  const visibleItems = useMemo(() => {
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, startIndex, endIndex]);

  const handleOpenEdit = useCallback((item: MenuItem) => {
    setEditingItem(item);
  }, []);

  const handleToggleAvailability = useCallback((id: string, newAvailable: boolean) => {
    toggleItemAvailability(id, newAvailable);
  }, [toggleItemAvailability]);

  const handleSaveAdd = async () => {
    // 1. Wajib ada nama menu
    const trimmed = addName.trim();
    if (!trimmed) {
      triggerShake('name');
      addNameInputRef.current?.focus();
      return;
    }

    // 2. Wajib ada harga jual > 0
    if (!addPrice || addPrice <= 0) {
      triggerShake('price');
      addPriceInputRef.current?.focus();
      return;
    }

    const selectedGroup = groups.find((g) => g.id === addGroupId) || groups[0];

    await addMenuItem({
      name: trimmed,
      price_idr: Number(addPrice) || 0,
      available: addAvailable,
      group_id: addGroupId,
      category: selectedGroup ? selectedGroup.category : 'makanan',
      photo_path: addPhotoPath,
      sort: items.length + 1,
    } as any);

    setAddName('');
    setAddPrice(0);
    setAddPriceStr('');
    setAddAvailable(true);
    setAddPhotoPath(null);
    setShakeField(null);
    setIsAddOpen(false);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveAdd();
    }
  };

  return (
    <div className="tk-phone-screen" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Input File Tersembunyi untuk Upload Foto Makanan */}
      <input
        ref={foodFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFoodFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* 1. Header Judul & Tombol Tambah Menu (Posisi sejajar dengan Beranda HP: margin 8px 4px 16px) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '8px 4px 16px',
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
      <div style={{ margin: '0 4px 16px', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center' }}>
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

      {/* 4. Daftar Kartu Menu Kafe (Dioptimalkan dengan Viewport Culling Virtualization) */}
      <div
        ref={listContainerRef}
        onScroll={handleListScroll}
        className="tk-custom-slider"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '2px',
          paddingBottom: '88px', // Ruang untuk navbar pill
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          position: 'relative',
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
          <div
            style={{
              height: `${totalHeight}px`,
              position: 'relative',
              width: '100%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translate3d(0, ${offsetY}px, 0)`,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {visibleItems.map((item) => (
                <PhoneMenuItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleOpenEdit}
                  onToggle={handleToggleAvailability}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Modal Detail Menu */}
      <MenuDetailModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
      />

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <button
                type="button"
                onClick={() => setAddAvailable(!addAvailable)}
                aria-label={addAvailable ? 'Menu aktif' : 'Menu dinonaktifkan'}
                title={addAvailable ? 'Menu aktif' : 'Menu dinonaktifkan'}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: 'var(--r-pill)',
                  background: addAvailable ? 'var(--accent)' : 'var(--ctl-line)',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: 'var(--r-pill)',
                    background: '#ffffff',
                    transform: addAvailable ? 'translateX(20px)' : 'translateX(0px)',
                    transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              {/* Baris Pertama: Label Nama Menu mulai dari Box Foto */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: shakeField === 'name' ? 'var(--danger)' : 'var(--ink-3)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    transition: 'color 0.15s ease',
                  }}
                >
                  Nama Menu
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Box Foto Makanan (52x52, Opsional) */}
                  <div
                    onClick={handlePhotoBoxClick}
                    onPointerDown={handlePointerDownFoodPhoto}
                    onPointerUp={handlePointerUpFoodPhoto}
                    onPointerLeave={handlePointerUpFoodPhoto}
                    onPointerCancel={handlePointerUpFoodPhoto}
                    role="button"
                    tabIndex={0}
                    aria-label="Foto makanan (Opsional)"
                    title={addPhotoPath ? "Klik untuk opsi foto, tahan untuk melihat pratinjau" : "Klik untuk memilih foto makanan (opsional)"}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--ctl)',
                      border: '1px solid var(--ctl-line)',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      touchAction: 'none',
                    }}
                  >
                    {addPhotoPath ? (
                      <img
                        src={addPhotoPath}
                        alt="Foto makanan baru"
                        draggable={false}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          pointerEvents: 'none',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          WebkitTouchCallout: 'none',
                          zIndex: 1,
                        }}
                      />
                    ) : (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--ink-3)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    )}

                    {/* Shield pelindung anti-copy / anti-hold */}
                    <div
                      style={{ position: 'absolute', inset: 0, zIndex: 2 }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    />

                    {/* Icon Sunting Liquid Glass di ujung kanan bawah (Sesuai Dialog Tablet) */}
                    <div
                      className="g-liquid"
                      style={{
                        position: 'absolute',
                        bottom: '3px',
                        right: '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: 'var(--r-pill)',
                        border: '1px solid rgba(255, 255, 255, 0.40)',
                        background: 'color-mix(in srgb, var(--acrylic-bg) 75%, transparent)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        display: 'grid',
                        placeItems: 'center',
                        zIndex: 3,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                        color: 'var(--ink)',
                        pointerEvents: 'none',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </div>
                  </div>

                  {/* Input Nama Menu (52px) */}
                  <input
                    ref={addNameInputRef}
                    type="text"
                    className={shakeField === 'name' ? 'tk-field-rejecting' : ''}
                    placeholder="Contoh: Kopi Susu Aren"
                    value={addName}
                    onChange={(e) => {
                      setAddName(e.target.value);
                      if (shakeField === 'name') setShakeField(null);
                    }}
                    onKeyDown={handleAddKeyDown}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: '52px',
                      padding: '0 14px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--ctl)',
                      border: shakeField === 'name' ? '1.5px solid var(--danger)' : '1px solid var(--ctl-line)',
                      color: 'var(--ink)',
                      fontSize: 'var(--t-sm)',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Baris Kedua: Harga Jual */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: shakeField === 'price' ? 'var(--danger)' : 'var(--ink-3)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    transition: 'color 0.15s ease',
                  }}
                >
                  Harga Jual
                </label>
                <div
                  className={`tk-price-field ${shakeField === 'price' ? 'tk-field-rejecting' : ''}`}
                  style={{
                    border: shakeField === 'price' ? '1.5px solid var(--danger)' : undefined,
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--t-sm)',
                      fontWeight: 800,
                      color: 'var(--ink-2)',
                      userSelect: 'none',
                      lineHeight: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      marginRight: '6px',
                      flexShrink: 0,
                    }}
                  >
                    Rp
                  </span>
                  <input
                    ref={addPriceInputRef}
                    type="text"
                    inputMode="numeric"
                    className="tk-no-focus-outline"
                    value={addPriceStr}
                    placeholder="0"
                    onChange={(e) => {
                      const formatted = formatThousands(e.target.value);
                      setAddPriceStr(formatted);
                      setAddPrice(parseThousands(formatted));
                      if (shakeField === 'price') setShakeField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '0') {
                        const input = e.currentTarget;
                        const isAtStart = input.selectionStart === 0;
                        const isAllSelected =
                          input.selectionStart === 0 && input.selectionEnd === input.value.length;
                        if (!input.value || isAtStart || isAllSelected) {
                          e.preventDefault();
                          return;
                        }
                      }
                      handleAddKeyDown(e);
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
                      margin: 0,
                      lineHeight: 1,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Baris Ketiga: Kategori Menu (Drop Up) */}
              <CategoryDropdown
                label="Kategori Menu"
                selectedGroupId={addGroupId}
                groups={groups}
                onSelectGroup={(id) => setAddGroupId(id)}
                direction="up"
              />

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

      {/* Modal Opsi Foto Makanan Murni Ikon (Eyes, Sunting, Trash, Batal) */}
      <PhotoActionsDialog
        isOpen={isPhotoActionsOpen}
        hasPhoto={Boolean(addPhotoPath)}
        onClose={() => setIsPhotoActionsOpen(false)}
        onViewPhoto={() => setIsPreviewFoodOpen(true)}
        onChangePhoto={() => foodFileInputRef.current?.click()}
        onDeletePhoto={() => {
          triggerHapticDelete();
          setAddPhotoPath(null);
        }}
      />

      {/* Lightbox Pratinjau Foto Makanan (Sama Persis Profil saat di-hold) */}
      {isPreviewFoodOpen && addPhotoPath && (
        <div
          className="tk-phone-overlay ov"
          onClick={() => setIsPreviewFoodOpen(false)}
          role="dialog"
          aria-modal="true"
          style={{
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            className="g-liquid"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '24px 20px',
              borderRadius: 'var(--r-xl)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              width: '88%',
              maxWidth: '320px',
              textAlign: 'center',
              animation: 'tk-fade-in 0.2s ease',
            }}
          >
            <div
              style={{
                width: '180px',
                height: '180px',
                borderRadius: 'var(--r-lg)',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
                background: 'var(--ctl)',
                border: '1px solid var(--ctl-line)',
              }}
            >
              <img
                src={addPhotoPath || ''}
                alt={addName || 'Foto makanan'}
                draggable={false}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  zIndex: 1,
                  animation: 'tk-photo-zoom-out 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
              />
              {/* Pelindung anti copy/hold */}
              <div
                style={{ position: 'absolute', inset: 0, zIndex: 2 }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
              {/* Icon sunting liquid glass di pojok kanan bawah */}
              <button
                type="button"
                onClick={() => {
                  setIsPreviewFoodOpen(false);
                  setIsPhotoActionsOpen(true);
                }}
                aria-label="Sunting foto makanan"
                title="Sunting foto makanan"
                className="g-liquid"
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--r-pill)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 5,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                  color: 'var(--ink)',
                  background: 'color-mix(in srgb, var(--acrylic-bg) 75%, transparent)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
            <b style={{ fontSize: 'var(--t-sm)', color: 'var(--ink)' }}>
              {addName || 'Foto Makanan'}
            </b>
            <button
              type="button"
              className="tk-btn-lime"
              onClick={() => setIsPreviewFoodOpen(false)}
              style={{ width: '100%', height: '44px', fontSize: 'var(--t-sm)', fontWeight: 700 }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* 7. Dialog Crop Foto Makanan (1:1 Resolusi Tetap Bersih Sesuai Profil) */}
      <CropProfileDialog
        isOpen={isCropFoodOpen}
        title="Sesuaikan Foto Makanan"
        imageSrc={cropFoodImageSrc}
        onClose={() => {
          setIsCropFoodOpen(false);
          if (cropFoodImageSrc) {
            URL.revokeObjectURL(cropFoodImageSrc);
            setCropFoodImageSrc(null);
          }
        }}
        onCropComplete={handleFoodCropComplete}
      />
    </div>
  );
};

export default PhoneMenuScreen;
