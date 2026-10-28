import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCashierStore, DEFAULT_CASHIERS, isImmutableCashier, removeInvalidCashierAvatar } from '../../../stores/cashierStore.ts';
import { useShopStore, removeInvalidOwnerAvatar } from '../../../stores/shopStore.ts';
import { PhoneThemeSheet } from '../components/PhoneThemeSheet.tsx';
import { Cashier } from '../../../lib/supabase/types.ts';
import { triggerHapticFeedback } from '../../../lib/device/haptics.ts';
import { registerBackHandler } from '../../../lib/device/backButton.ts';
import { CropProfileDialog } from '../../../features/akun/CropProfileDialog.tsx';
import { PhotoActionsDialog } from '../../../design/components/PhotoActionsDialog.tsx';

export interface PhoneAccountScreenProps {
  onOpenPrintMenu?: () => void;
}

export const PhoneAccountScreen: React.FC<PhoneAccountScreenProps> = ({
  onOpenPrintMenu,
}) => {
  const { cashiers, addNewCashier, removeCashier, fetchCashiers } = useCashierStore();
  const { shop, updateOwnerAvatar, removeOwnerAvatar, fetchShop } = useShopStore();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isAddCashierOpen, setIsAddCashierOpen] = useState(false);
  const [newCashierName, setNewCashierName] = useState('');
  const [selectedCashierToRemove, setSelectedCashierToRemove] = useState<Cashier | null>(null);
  const [canConfirmRemove, setCanConfirmRemove] = useState(false);
  const [rejectingCashierId, setRejectingCashierId] = useState<string | null>(null);

  // Profil Pemilik (Sinkron dengan database Supabase & cache lokal)
  const [ownerAvatar, setOwnerAvatar] = useState<string | null>(() => {
    try {
      return localStorage.getItem('tk_owner_avatar');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (shop.owner_avatar_url) {
      setOwnerAvatar(shop.owner_avatar_url);
    }
  }, [shop.owner_avatar_url]);

  useEffect(() => {
    fetchShop().catch(() => {});
  }, [fetchShop]);

  const [isCropOwnerOpen, setIsCropOwnerOpen] = useState(false);
  const [cropOwnerImageSrc, setCropOwnerImageSrc] = useState<string | null>(null);
  const [isOwnerActionsOpen, setIsOwnerActionsOpen] = useState(false);
  const [isOwnerPreviewOpen, setIsOwnerPreviewOpen] = useState(false);
  const ownerFileInputRef = useRef<HTMLInputElement>(null);
  const ownerHoldTimerRef = useRef<number | null>(null);
  const didTriggerOwnerHoldRef = useRef(false);
  const ownerPointerStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleOwnerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropOwnerImageSrc(url);
    setIsCropOwnerOpen(true);
    e.target.value = '';
  };

  const handleOwnerCropComplete = async (croppedBlob: Blob) => {
    setIsCropOwnerOpen(false);
    if (cropOwnerImageSrc) {
      URL.revokeObjectURL(cropOwnerImageSrc);
      setCropOwnerImageSrc(null);
    }

    // Tampilkan preview instan secara lokal
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setOwnerAvatar(dataUrl);
    };
    reader.readAsDataURL(croppedBlob);

    // Simpan ke Supabase Storage & database tabel shops
    try {
      const publicUrl = await updateOwnerAvatar(croppedBlob);
      if (publicUrl) {
        setOwnerAvatar(publicUrl);
      }
    } catch {
      // ignore
    }
  };

  const handleRemoveOwnerPhoto = async () => {
    setOwnerAvatar(null);
    setIsOwnerActionsOpen(false);
    try {
      await removeOwnerAvatar();
    } catch {
      // ignore
    }
  };

  const startOwnerHold = (e: React.PointerEvent) => {
    didTriggerOwnerHoldRef.current = false;
    ownerPointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    if (ownerHoldTimerRef.current) {
      clearTimeout(ownerHoldTimerRef.current);
    }
    ownerHoldTimerRef.current = window.setTimeout(() => {
      didTriggerOwnerHoldRef.current = true;
      triggerHapticFeedback([30]);
      setIsOwnerActionsOpen(true);
      ownerHoldTimerRef.current = null;
    }, 400);
  };

  const cancelOwnerHold = () => {
    if (ownerHoldTimerRef.current) {
      clearTimeout(ownerHoldTimerRef.current);
      ownerHoldTimerRef.current = null;
    }
    ownerPointerStartPosRef.current = null;
  };

  const checkOwnerHoldMovement = (e: React.PointerEvent) => {
    if (ownerPointerStartPosRef.current && ownerHoldTimerRef.current) {
      const dx = Math.abs(e.clientX - ownerPointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - ownerPointerStartPosRef.current.y);
      if (dx > 15 || dy > 15) {
        cancelOwnerHold();
      }
    }
  };

  const handleOwnerAvatarClick = () => {
    if (didTriggerOwnerHoldRef.current) {
      didTriggerOwnerHoldRef.current = false;
      return;
    }
    setIsOwnerActionsOpen(true);
  };

  const holdTimerRef = useRef<number | null>(null);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!selectedCashierToRemove) {
      setCanConfirmRemove(false);
      return undefined;
    }
    setCanConfirmRemove(false);
    const timer = setTimeout(() => setCanConfirmRemove(true), 320);
    return () => clearTimeout(timer);
  }, [selectedCashierToRemove]);

  const portalTarget = typeof document !== 'undefined'
    ? (document.getElementById('tk-portal-root') || document.body)
    : null;

  useEffect(() => {
    fetchCashiers().catch(() => {});
  }, [fetchCashiers]);

  // Sembunyikan navbar saat dialog terbuka
  useEffect(() => {
    if (isAddCashierOpen || selectedCashierToRemove || isThemeOpen || isCropOwnerOpen || isOwnerActionsOpen || isOwnerPreviewOpen) {
      document.body.classList.add('has-modal');
    } else {
      document.body.classList.remove('has-modal');
    }
    return () => {
      document.body.classList.remove('has-modal');
    };
  }, [isAddCashierOpen, selectedCashierToRemove, isThemeOpen, isCropOwnerOpen, isOwnerActionsOpen, isOwnerPreviewOpen]);

  // Tangani tombol back default Android & Escape Windows saat ada modal/sheet terbuka
  useEffect(() => {
    if (
      !isAddCashierOpen &&
      !selectedCashierToRemove &&
      !isThemeOpen &&
      !isCropOwnerOpen &&
      !isOwnerActionsOpen &&
      !isOwnerPreviewOpen
    ) {
      return undefined;
    }

    return registerBackHandler(() => {
      if (isCropOwnerOpen) {
        setIsCropOwnerOpen(false);
        if (cropOwnerImageSrc) {
          URL.revokeObjectURL(cropOwnerImageSrc);
          setCropOwnerImageSrc(null);
        }
        return true;
      }
      if (isOwnerPreviewOpen) {
        setIsOwnerPreviewOpen(false);
        return true;
      }
      if (isOwnerActionsOpen) {
        setIsOwnerActionsOpen(false);
        return true;
      }
      if (selectedCashierToRemove) {
        setSelectedCashierToRemove(null);
        return true;
      }
      if (isAddCashierOpen) {
        setIsAddCashierOpen(false);
        return true;
      }
      if (isThemeOpen) {
        setIsThemeOpen(false);
        return true;
      }
      return false;
    }, 85);
  }, [
    isAddCashierOpen,
    selectedCashierToRemove,
    isThemeOpen,
    isCropOwnerOpen,
    isOwnerActionsOpen,
    isOwnerPreviewOpen,
    cropOwnerImageSrc,
  ]);

  // Pastikan minimal ada kasir bawaan sesuai preview.pdf
  const displayCashiers = cashiers.length > 0
    ? cashiers.filter((c) => c.active)
    : DEFAULT_CASHIERS;

  const startHold = (cashier: Cashier, e: React.PointerEvent) => {
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    // Robertus Amaresi dan Puspitawati adalah kasir default yang tidak bisa dihapus: animasi merah menolak pada teks & getaran hp tanpa notifikasi toast
    if (isImmutableCashier(cashier.id, cashier.name)) {
      holdTimerRef.current = window.setTimeout(() => {
        setRejectingCashierId(cashier.id);
        triggerHapticFeedback([40, 60, 40]);
        setTimeout(() => setRejectingCashierId(null), 500);
        holdTimerRef.current = null;
      }, 420);
      return;
    }

    holdTimerRef.current = window.setTimeout(() => {
      setSelectedCashierToRemove(cashier);
      holdTimerRef.current = null;
    }, 500);
  };

  const cancelHold = (e?: React.PointerEvent) => {
    if (e && pointerStartPosRef.current) {
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      if (dx > 25 || dy > 25) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }
      return;
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    pointerStartPosRef.current = null;
  };

  const handleAddCashierSubmit = async () => {
    const trimmed = newCashierName.trim();
    if (!trimmed) return;
    try {
      await addNewCashier(trimmed);
      setNewCashierName('');
      setIsAddCashierOpen(false);
    } catch {
      // Tanpa notifikasi toast sesuai instruksi
    }
  };

  const handleRemoveCashierConfirm = async () => {
    if (!selectedCashierToRemove) return;
    const id = selectedCashierToRemove.id;
    setSelectedCashierToRemove(null);

    try {
      await removeCashier(id);
    } catch {
      // Tanpa notifikasi toast sesuai instruksi
    }
  };

  return (
    <div className="tk-phone-screen" style={{ overflow: 'hidden' }}>
      {/* Input File Tersembunyi untuk Upload Foto Profil Pemilik */}
      <input
        ref={ownerFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleOwnerFileChange}
        style={{ display: 'none' }}
      />

      {/* 1. Judul Layar Sesuai Frame 5 PDF */}
      <h1 className="tk-phone-title">Akun</h1>

      {/* 2. Hero Card Profil Pemilik Sesuai Frame 5 PDF */}
      <div
        className="g-acrylic tk-phone-hero"
        style={{
          alignItems: 'center',
          textAlign: 'center',
          padding: '24px 20px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '68px',
            height: '68px',
            marginBottom: '8px',
            display: 'inline-block',
          }}
        >
          {/* Avatar Box (overflow: hidden agar sudut rounded tetap rapi) */}
          <div
            onClick={handleOwnerAvatarClick}
            onPointerDown={startOwnerHold}
            onPointerUp={cancelOwnerHold}
            onPointerLeave={cancelOwnerHold}
            onPointerCancel={cancelOwnerHold}
            onPointerMove={checkOwnerHoldMovement}
            role="button"
            tabIndex={0}
            aria-label="Foto Profil Pemilik (Tahan untuk melihat pratinjau)"
            title="Klik atau tahan untuk melihat profil"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 'var(--r-xl)',
              background: ownerAvatar ? 'var(--ctl)' : 'var(--accent)',
              color: 'var(--on-accent)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 'var(--t-xl)',
              lineHeight: 'var(--l-xl)',
              fontWeight: 800,
              boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 30%, transparent)',
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              touchAction: 'none',
            }}
          >
            {ownerAvatar ? (
              <img
                src={ownerAvatar}
                alt="Profil Pemilik"
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
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  setOwnerAvatar(null);
                  removeInvalidOwnerAvatar();
                }}
              />
            ) : (
              <span style={{ position: 'relative', zIndex: 1, userSelect: 'none' }}>P</span>
            )}

            {/* Shield anti-copy/hold */}
            <div
              style={{ position: 'absolute', inset: 0, zIndex: 2 }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </div>

          {/* Icon Sunting Liquid Glass di ujung kanan bawah yang sedikit keluar dari profile */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOwnerActionsOpen(true);
            }}
            aria-label="Sunting foto profil pemilik"
            title="Sunting foto profil"
            className="g-liquid"
            style={{
              position: 'absolute',
              bottom: '-3px',
              right: '-3px',
              width: '24px',
              height: '24px',
              borderRadius: 'var(--r-pill)',
              border: '1px solid rgba(255, 255, 255, 0.40)',
              background: 'color-mix(in srgb, var(--acrylic-bg) 85%, transparent)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 10,
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.45)',
              color: 'var(--ink)',
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        <b
          style={{
            fontSize: 'var(--t-lg)',
            lineHeight: 'var(--l-lg)',
            fontWeight: 800,
            color: 'var(--ink)',
          }}
        >
          Pemilik
        </b>
        <span
          style={{
            fontSize: 'var(--t-sm)',
            lineHeight: 'var(--l-sm)',
            color: 'var(--ink-3)',
            marginTop: '2px',
          }}
        >
          {shop.name || 'Tati’e Kitchen'}
        </span>
      </div>

      {/* 3. Daftar Kasir Sesuai Frame 5 PDF */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '16px 4px 8px',
        }}
      >
        <h2 className="tk-phone-section-title" style={{ margin: 0 }}>
          Kasir
        </h2>
        <button
          type="button"
          onClick={() => setIsAddCashierOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent)',
            fontSize: 'var(--t-xs)',
            lineHeight: 'var(--l-xs)',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          + Tambah kasir
        </button>
      </div>

      <div
        className={`tk-phone-list-card ${displayCashiers.length > 3 ? 'tk-custom-slider' : ''}`}
        style={{
          marginBottom: '16px',
          maxHeight: displayCashiers.length > 3 ? '184px' : 'none',
          overflowY: displayCashiers.length > 3 ? 'auto' : 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {displayCashiers.map((cashier) => {
          const initials = (() => {
            const parts = (cashier.name || '').trim().split(/\s+/);
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
          })();

          return (
            <div
              key={cashier.id}
              className="tk-phone-row rw"
              onPointerDown={(e) => startHold(cashier, e)}
              onPointerUp={() => cancelHold()}
              onPointerCancel={() => cancelHold()}
              onPointerMove={(e) => cancelHold(e)}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'pan-y',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              {/* Profile kecil di sebelah kiri sebelum nama kasir */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--ctl)',
                  border: '1px solid var(--ctl-line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--ink-2)',
                  flexShrink: 0,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', zIndex: 0, userSelect: 'none' }}>
                  {initials}
                </span>
                {cashier.avatar_url && (
                  <img
                    src={cashier.avatar_url}
                    alt={cashier.name}
                    draggable={false}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 1,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      removeInvalidCashierAvatar(cashier.id);
                    }}
                  />
                )}
                {/* Shield pelindung anti-copy & anti-hold */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                />
              </div>

              <span
                className={rejectingCashierId === cashier.id ? 'tk-text-rejecting' : ''}
                style={{
                  fontSize: 'var(--t-md)',
                  lineHeight: 'var(--l-md)',
                  fontWeight: 400,
                  color: 'var(--ink)',
                  display: 'inline-block',
                  marginRight: 'auto',
                  overflow: 'visible',
                  whiteSpace: 'nowrap',
                }}
              >
                {cashier.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. Tombol Pengaturan Tampilan Tema & Cetak Menu Fisik (Kiri: Tampilan Lebih Lebar, Kanan: Icon Cetak Menu Fisik A4) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          margin: '0 4px 16px',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          className="tk-btn-appearance"
          onClick={() => setIsThemeOpen(true)}
          aria-haspopup="dialog"
          aria-label="Atur tampilan tema dan warna"
          style={{ flex: 1, minWidth: 0, height: '48px', boxSizing: 'border-box' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="tk-dot-color" />
            <span>Tampilan</span>
          </span>
          <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>▾</span>
        </button>

        <button
          type="button"
          className="tk-btn-icon-circle"
          onClick={() => {
            if (onOpenPrintMenu) onOpenPrintMenu();
          }}
          aria-label="Cetak menu fisik (A4)"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" rx="1" />
          </svg>
        </button>
      </div>

      {/* 5. Bottom Sheet Pemilih Tampilan Tema & 6 Palet Warna */}
      <PhoneThemeSheet
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
      />

      {/* 8. Dialog Tambah Kasir (Di-portal ke Root agar Terkurung Sempurna Tanpa Cutoff) */}
      {isAddCashierOpen && portalTarget && createPortal(
        <div
          className="tk-phone-overlay ov"
          onClick={() => setIsAddCashierOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Tambah kasir"
        >
          <div
            className="g-liquid tk-phone-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <b
              style={{
                fontSize: 'var(--t-lg)',
                lineHeight: 'var(--l-lg)',
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Tambah kasir
            </b>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                type="text"
                placeholder="Nama kasir"
                value={newCashierName}
                onChange={(e) => setNewCashierName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCashierSubmit();
                }}
                style={{
                  height: '48px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--ctl)',
                  border: '1px solid var(--ctl-line)',
                  color: 'var(--ink)',
                  padding: '0 16px',
                  fontFamily: 'inherit',
                  fontSize: 'var(--t-sm)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: 'var(--t-xs)',
                  lineHeight: 'var(--l-xs)',
                  color: 'var(--ink-2)',
                }}
              >
                Nama kasir baru akan langsung tersinkron ke semua perangkat.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                className="tk-btn-flat"
                onClick={() => {
                  setNewCashierName('');
                  setIsAddCashierOpen(false);
                }}
                style={{ flex: 1, height: '48px', fontSize: 'var(--t-sm)' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="tk-btn-lime"
                onClick={handleAddCashierSubmit}
                disabled={!newCashierName.trim()}
                style={{
                  flex: 1,
                  height: '48px',
                  fontSize: 'var(--t-sm)',
                  opacity: newCashierName.trim() ? 1 : 0.45,
                }}
              >
                Tambah
              </button>
            </div>
          </div>
        </div>,
        portalTarget
      )}

      {/* 9. Dialog Konfirmasi Hapus Kasir (Di-portal ke Root agar Terkurung Sempurna Tanpa Cutoff) */}
      {selectedCashierToRemove && portalTarget && createPortal(
        <div
          className="tk-phone-overlay ov"
          onClick={() => setSelectedCashierToRemove(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi Hapus Kasir"
        >
          <div
            className="g-liquid tk-phone-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ gap: '14px' }}
          >
            <b
              style={{
                fontSize: 'var(--t-lg)',
                lineHeight: 'var(--l-lg)',
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Hapus kasir?
            </b>

            <span
              style={{
                fontSize: 'var(--t-sm)',
                lineHeight: 'var(--l-sm)',
                color: 'var(--ink-2)',
              }}
            >
              Hapus akun kasir <b>{selectedCashierToRemove.name}</b> dari daftar kasir toko?
            </span>

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                type="button"
                className="tk-btn-flat"
                onClick={() => setSelectedCashierToRemove(null)}
                style={{ flex: 1, height: '48px', fontSize: 'var(--t-sm)' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={canConfirmRemove ? handleRemoveCashierConfirm : undefined}
                disabled={!canConfirmRemove}
                style={{
                  flex: 1,
                  height: '48px',
                  fontSize: 'var(--t-sm)',
                  fontWeight: 800,
                  background: 'var(--danger)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--r-md)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.25)',
                  cursor: canConfirmRemove ? 'pointer' : 'not-allowed',
                  opacity: canConfirmRemove ? 1 : 0.6,
                  pointerEvents: canConfirmRemove ? 'auto' : 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  transition: 'opacity 0.15s ease, transform 0.1s ease',
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>,
        portalTarget
      )}

      {/* 10. Dialog Pilihan Foto Profil Pemilik Murni Ikon (Eyes, Sunting, Trash, Batal) */}
      <PhotoActionsDialog
        isOpen={isOwnerActionsOpen}
        hasPhoto={Boolean(ownerAvatar)}
        onClose={() => setIsOwnerActionsOpen(false)}
        onViewPhoto={() => setIsOwnerPreviewOpen(true)}
        onChangePhoto={() => ownerFileInputRef.current?.click()}
        onDeletePhoto={handleRemoveOwnerPhoto}
      />

      {/* 11. Lightbox Pratinjau Foto Profil Pemilik (Zoom Out) */}
      {isOwnerPreviewOpen && portalTarget && createPortal(
        <div
          className="tk-phone-overlay ov"
          onClick={() => setIsOwnerPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          style={{ zIndex: 100 }}
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
                background: ownerAvatar ? 'var(--ctl)' : 'var(--accent)',
                color: 'var(--on-accent)',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid var(--ctl-line)',
              }}
            >
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt="Foto Profil Pemilik"
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
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    setOwnerAvatar(null);
                    removeInvalidOwnerAvatar();
                  }}
                />
                ) : (
                  <span style={{ fontSize: '72px', fontWeight: 800, userSelect: 'none' }}>P</span>
                )}
                <div
                  style={{ position: 'absolute', inset: 0, zIndex: 2 }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsOwnerPreviewOpen(false);
                    setIsOwnerActionsOpen(true);
                  }}
                  aria-label="Sunting foto profil"
                  title="Sunting foto profil"
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
              Foto Profil Pemilik
            </b>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              {ownerAvatar ? (
                <button
                  type="button"
                  className="tk-btn-flat"
                  onClick={() => {
                    setIsOwnerPreviewOpen(false);
                    handleRemoveOwnerPhoto();
                  }}
                  style={{ flex: 1, height: '40px', color: 'var(--danger)', fontSize: 'var(--t-xs)', fontWeight: 700 }}
                >
                  Hapus Foto
                </button>
              ) : (
                <button
                  type="button"
                  className="tk-btn-flat"
                  onClick={() => {
                    setIsOwnerPreviewOpen(false);
                    ownerFileInputRef.current?.click();
                  }}
                  style={{ flex: 1, height: '40px', fontSize: 'var(--t-xs)', fontWeight: 700 }}
                >
                  Pilih Foto
                </button>
              )}
              <button
                type="button"
                className="tk-btn-lime"
                onClick={() => setIsOwnerPreviewOpen(false)}
                style={{ flex: 1, height: '40px', fontSize: 'var(--t-xs)' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        portalTarget
      )}

      {/* 12. Dialog Crop Foto Profil Pemilik 1:1 Resolusi Tetap */}
      <CropProfileDialog
        isOpen={isCropOwnerOpen}
        imageSrc={cropOwnerImageSrc}
        onClose={() => {
          setIsCropOwnerOpen(false);
          if (cropOwnerImageSrc) {
            URL.revokeObjectURL(cropOwnerImageSrc);
            setCropOwnerImageSrc(null);
          }
        }}
        onCropComplete={handleOwnerCropComplete}
      />
    </div>
  );
};

export default PhoneAccountScreen;
