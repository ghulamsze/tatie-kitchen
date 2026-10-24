import React, { useState, useEffect, useRef } from 'react';
import { useCashierStore, DEFAULT_CASHIERS } from '../../../stores/cashierStore.ts';
import { useShopStore } from '../../../stores/shopStore.ts';
import { PhoneThemeSheet } from '../components/PhoneThemeSheet.tsx';
import { PhonePrintMenuPreview } from '../components/PhonePrintMenuPreview.tsx';
import { Toast } from '../../../design/components/Toast.tsx';
import { Cashier } from '../../../lib/supabase/types.ts';

export interface PhoneAccountScreenProps {
  onOpenPrintMenu?: () => void;
}

export const PhoneAccountScreen: React.FC<PhoneAccountScreenProps> = ({
  onOpenPrintMenu,
}) => {
  const { cashiers, addNewCashier, removeCashier, fetchCashiers } = useCashierStore();
  const { shop } = useShopStore();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAddCashierOpen, setIsAddCashierOpen] = useState(false);
  const [newCashierName, setNewCashierName] = useState('');
  const [selectedCashierToRemove, setSelectedCashierToRemove] = useState<Cashier | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetchCashiers().catch(() => {});
  }, [fetchCashiers]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Pastikan minimal ada kasir bawaan sesuai preview.pdf
  const displayCashiers = cashiers.length > 0
    ? cashiers.filter((c) => c.active)
    : DEFAULT_CASHIERS;

  const startHold = (cashier: Cashier, e: React.PointerEvent) => {
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      setSelectedCashierToRemove(cashier);
      holdTimerRef.current = null;
    }, 500);
  };

  const cancelHold = (e?: React.PointerEvent) => {
    if (e && pointerStartPosRef.current) {
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      if (dx > 12 || dy > 12) {
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
      showToast(`Kasir ${trimmed} berhasil ditambahkan`);
    } catch {
      showToast('Gagal menambahkan kasir baru');
    }
  };

  const handleRemoveCashierConfirm = async () => {
    if (!selectedCashierToRemove) return;
    const name = selectedCashierToRemove.name;
    const id = selectedCashierToRemove.id;
    setSelectedCashierToRemove(null);

    try {
      await removeCashier(id);
      showToast(`Kasir ${name} berhasil dihapus`);
    } catch {
      showToast('Gagal menghapus kasir');
    }
  };

  return (
    <div className="tk-phone-screen">
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

      <div className="tk-phone-list-card" style={{ marginBottom: '16px' }}>
        {displayCashiers.map((cashier) => (
          <div
            key={cashier.id}
            className="tk-phone-row rw"
            onPointerDown={(e) => startHold(cashier, e)}
            onPointerUp={() => cancelHold()}
            onPointerCancel={() => cancelHold()}
            onPointerMove={(e) => cancelHold(e)}
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <b
                style={{
                  fontSize: 'var(--t-md)',
                  lineHeight: 'var(--l-md)',
                  fontWeight: 600,
                  color: 'var(--ink)',
                }}
              >
                {cashier.name}
              </b>
              <span style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '2px' }}>
                Tekan tahan untuk menghapus
              </span>
            </div>
            <span style={{ color: 'var(--ink-3)', fontSize: 'var(--t-xs)' }}>
              Hold ✕
            </span>
          </div>
        ))}
      </div>

      {/* 4. Tombol Pengaturan Tampilan Tema & Palet Sesuai Frame 5 PDF */}
      <div
        className="tk-phone-range-trigger rg g vb"
        onClick={() => setIsThemeOpen(true)}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label="Atur tampilan tema dan warna"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsThemeOpen(true);
          }
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="dotc" aria-hidden="true" />
          <span>Tampilan</span>
        </span>
        <span style={{ color: 'var(--ink-3)' }}>▾</span>
      </div>

      {/* 5. Tombol Cetak Menu: Langsung Buka Pratinjau Lembar A4 yang Jelas */}
      <button
        type="button"
        className="tk-btn-flat"
        onClick={() => {
          setIsPreviewOpen(true);
          if (onOpenPrintMenu) onOpenPrintMenu();
        }}
        style={{
          width: '100%',
          height: '48px',
          marginBottom: '16px',
          fontSize: 'var(--t-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <span>🖨️</span>
        <span>Cetak menu fisik (A4)</span>
      </button>

      {/* 6. Bottom Sheet Pemilih Tampilan Tema & 6 Palet Warna */}
      <PhoneThemeSheet
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
      />

      {/* 7. Layar Pratinjau Menu Cetak A4 (Muncul saat Cetak Menu) */}
      <PhonePrintMenuPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* 8. Dialog Tambah Kasir (Sesuai Frame 10k preview.pdf) */}
      {isAddCashierOpen && (
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
                Nama baru langsung tersimpan di database dan sinkron ke seluruh device.
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
        </div>
      )}

      {/* 9. Dialog Konfirmasi Hapus Kasir (Muncul saat Baris Kasir Di-Hold) */}
      {selectedCashierToRemove && (
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
            style={{ gap: '16px' }}
          >
            <b
              style={{
                fontSize: 'var(--t-lg)',
                lineHeight: 'var(--l-lg)',
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Hapus akun kasir?
            </b>

            <span
              style={{
                fontSize: 'var(--t-sm)',
                lineHeight: 'var(--l-sm)',
                color: 'var(--ink-2)',
              }}
            >
              Yakin ingin menghapus kasir <b>{selectedCashierToRemove.name}</b>?
              Perubahan akan tersimpan di database Supabase dan otomatis tersinkron ke semua device lain.
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
                onClick={handleRemoveCashierConfirm}
                style={{
                  flex: 1,
                  height: '48px',
                  fontSize: 'var(--t-sm)',
                  fontWeight: 800,
                  background: 'var(--danger)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
              >
                Hapus Kasir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifikasi Toast */}
      {toastMessage && <Toast message={toastMessage} visible={true} />}
    </div>
  );
};

export default PhoneAccountScreen;
