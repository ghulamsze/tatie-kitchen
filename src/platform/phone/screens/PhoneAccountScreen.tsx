import React, { useState } from 'react';
import { useCashierStore } from '../../../stores/cashierStore.ts';
import { useShopStore } from '../../../stores/shopStore.ts';
import { PhoneThemeSheet } from '../components/PhoneThemeSheet.tsx';
import { PhonePrintMenuDialog } from '../components/PhonePrintMenuDialog.tsx';
import { PrintMenuDocument } from '../components/PrintMenuDocument.tsx';

export interface PhoneAccountScreenProps {
  onOpenPrintMenu?: () => void;
  onLogout?: () => void;
}

export const PhoneAccountScreen: React.FC<PhoneAccountScreenProps> = ({
  onOpenPrintMenu,
  onLogout,
}) => {
  const { cashiers } = useCashierStore();
  const { shop } = useShopStore();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    isMargin4433: false,
    isInkSaver: false,
  });

  const activeCashiers = cashiers.filter((c) => c.active);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.search = '?device=tablet';
    }
  };

  const handleApplyPrint = (opts: { isMargin4433: boolean; isInkSaver: boolean }) => {
    setPrintOptions(opts);
    if (onOpenPrintMenu) onOpenPrintMenu();
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

      {/* 3. Daftar Kasir Sesuai Frame 5 PDF (Tanpa Badge Counter & Tanpa Badge Aktif) */}
      <div style={{ margin: '16px 4px 8px' }}>
        <h2 className="tk-phone-section-title" style={{ margin: 0 }}>
          Kasir
        </h2>
      </div>

      <div className="tk-phone-list-card" style={{ marginBottom: '16px' }}>
        {activeCashiers.length === 0 ? (
          <div
            style={{
              padding: '20px 16px',
              textAlign: 'center',
              color: 'var(--ink-3)',
              fontSize: 'var(--t-sm)',
            }}
          >
            Belum ada kasir
          </div>
        ) : (
          activeCashiers.map((cashier) => (
            <div
              key={cashier.id}
              className="tk-phone-row rw"
              style={{ cursor: 'default' }}
            >
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
            </div>
          ))
        )}
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

      {/* 5. Tombol Cetak Menu */}
      <button
        type="button"
        className="tk-btn-flat"
        onClick={() => setIsPrintDialogOpen(true)}
        style={{
          width: '100%',
          height: '48px',
          marginBottom: '12px',
          fontSize: 'var(--t-sm)',
        }}
      >
        Cetak menu
      </button>

      {/* 6. Tombol Keluar */}
      <button
        type="button"
        className="tk-btn-flat"
        onClick={handleLogout}
        style={{
          width: '100%',
          height: '48px',
          color: 'var(--ink-2)',
          fontSize: 'var(--t-sm)',
        }}
      >
        Keluar
      </button>

      {/* 7. Bottom Sheet Pemilih Tampilan Tema & 6 Palet Warna */}
      <PhoneThemeSheet
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
      />

      {/* 8. Dialog Konfigurasi Cetak Menu A4 */}
      <PhonePrintMenuDialog
        isOpen={isPrintDialogOpen}
        onClose={() => setIsPrintDialogOpen(false)}
        onPrint={handleApplyPrint}
      />

      {/* 9. Target Dokumen Cetak A4 */}
      <PrintMenuDocument
        isMargin4433={printOptions.isMargin4433}
        isInkSaver={printOptions.isInkSaver}
      />
    </div>
  );
};

export default PhoneAccountScreen;
