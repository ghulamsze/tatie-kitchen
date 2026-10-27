import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCashierStore, DEFAULT_CASHIERS, isImmutableCashier } from '../../../stores/cashierStore.ts';
import { useShopStore } from '../../../stores/shopStore.ts';
import { PhoneThemeSheet } from '../components/PhoneThemeSheet.tsx';
import { Cashier } from '../../../lib/supabase/types.ts';
import { triggerHapticFeedback } from '../../../lib/device/haptics.ts';
import { registerBackHandler } from '../../../lib/device/backButton.ts';

export interface PhoneAccountScreenProps {
  onOpenPrintMenu?: () => void;
}

export const PhoneAccountScreen: React.FC<PhoneAccountScreenProps> = ({
  onOpenPrintMenu,
}) => {
  const { cashiers, addNewCashier, removeCashier, fetchCashiers } = useCashierStore();
  const { shop } = useShopStore();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isAddCashierOpen, setIsAddCashierOpen] = useState(false);
  const [newCashierName, setNewCashierName] = useState('');
  const [selectedCashierToRemove, setSelectedCashierToRemove] = useState<Cashier | null>(null);
  const [canConfirmRemove, setCanConfirmRemove] = useState(false);
  const [rejectingCashierId, setRejectingCashierId] = useState<string | null>(null);

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
    if (isAddCashierOpen || selectedCashierToRemove || isThemeOpen) {
      document.body.classList.add('has-modal');
    } else {
      document.body.classList.remove('has-modal');
    }
    return () => {
      document.body.classList.remove('has-modal');
    };
  }, [isAddCashierOpen, selectedCashierToRemove, isThemeOpen]);

  // Tangani tombol back default Android saat dialog tambah/hapus kasir terbuka
  useEffect(() => {
    if (!isAddCashierOpen && !selectedCashierToRemove) return;
    return registerBackHandler(() => {
      if (selectedCashierToRemove) {
        setSelectedCashierToRemove(null);
        return true;
      }
      if (isAddCashierOpen) {
        setIsAddCashierOpen(false);
        return true;
      }
      return false;
    }, 85);
  }, [isAddCashierOpen, selectedCashierToRemove]);

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
            width: '64px',
            height: '64px',
            borderRadius: 'var(--r-xl)',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 'var(--t-xl)',
            lineHeight: 'var(--l-xl)',
            fontWeight: 800,
            marginBottom: '8px',
            boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 30%, transparent)',
          }}
        >
          P
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
                  border: 'none',
                  borderRadius: 'var(--r-md)',
                  cursor: canConfirmRemove ? 'pointer' : 'not-allowed',
                  opacity: 1,
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
    </div>
  );
};

export default PhoneAccountScreen;
