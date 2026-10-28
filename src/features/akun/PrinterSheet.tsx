import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sheet } from '../../design/components/Sheet.tsx';
import { Button } from '../../design/components/Button.tsx';
import { usePrinterStore } from '../../stores/printerStore.ts';
import { Toast } from '../../design/components/Toast.tsx';

export interface PrinterSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterSheet: React.FC<PrinterSheetProps> = ({ isOpen, onClose }) => {
  const {
    isConnected,
    selectedDevice,
    bondedDevices,
    autoPrint,
    isScanning,
    isPrinting,
    scanBondedDevices,
    connectDevice,
    disconnectDevice,
    setAutoPrint,
    printTest,
  } = usePrinterStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleScan = async () => {
    try {
      const devs = await scanBondedDevices();
      if (devs.length === 0) {
        showToast('Tidak ada printer Bluetooth yang terpasang (paired).');
      }
    } catch {
      showToast('Gagal memindai perangkat Bluetooth.');
    }
  };

  const handleConnect = async (device: { name: string; address: string }) => {
    try {
      const ok = await connectDevice(device);
      if (ok) {
        showToast(`Terhubung ke ${device.name}`);
      } else {
        showToast(`Gagal terhubung ke ${device.name}`);
      }
    } catch {
      showToast(`Gagal terhubung ke ${device.name}`);
    }
  };

  const handleTestPrint = async () => {
    const success = await printTest();
    if (success) {
      showToast('Uji coba cetak berhasil dikirim ke printer!');
    } else {
      showToast('Uji coba cetak gagal.');
    }
  };

  return (
    <>
      <Sheet isOpen={isOpen} onClose={onClose} title="Printer Thermal Bluetooth">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          {/* Status Koneksi */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--r-md)',
              background: 'var(--ctl)',
              border: '1px solid var(--ctl-line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)', display: 'block' }}>
                Status Koneksi
              </span>
              <b style={{ fontSize: 'var(--t-sm)', color: isConnected ? 'var(--accent-ink)' : 'var(--ink-3)' }}>
                {isConnected ? `Terhubung: ${selectedDevice?.name || 'Printer Bluetooth'}` : 'Belum Terhubung'}
              </b>
            </div>

            {isConnected ? (
              <Button variant="flat" size="md" onClick={disconnectDevice} style={{ height: '36px', fontSize: 'var(--t-xs)' }}>
                Putuskan
              </Button>
            ) : null}
          </div>

          {/* Toggle Auto-Print */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--r-md)',
              background: 'var(--ctl)',
              border: '1px solid var(--ctl-line)',
            }}
          >
            <div>
              <b style={{ fontSize: 'var(--t-sm)', display: 'block' }}>Cetak Otomatis</b>
              <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)' }}>
                Cetak struk langsung setelah pembayaran selesai
              </span>
            </div>

            <button
              type="button"
              onClick={() => setAutoPrint(!autoPrint)}
              style={{
                width: '48px',
                height: '28px',
                borderRadius: '14px',
                background: autoPrint ? 'var(--accent)' : 'rgba(255, 255, 255, 0.16)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s ease',
              }}
              aria-label="Toggle cetak otomatis"
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '3px',
                  left: autoPrint ? '23px' : '3px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>

          {/* Daftar Perangkat Terpasang */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--t-xs)', fontWeight: 700, color: 'var(--ink-2)' }}>
                Perangkat Bluetooth Terpasang
              </span>
              <button
                type="button"
                onClick={handleScan}
                disabled={isScanning}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-ink)',
                  fontSize: 'var(--t-xs)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isScanning ? 'Memindai...' : '↻ Pindai Ulang'}
              </button>
            </div>

            {bondedDevices.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                {bondedDevices.map((dev) => (
                  <div
                    key={dev.address}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--r-sm)',
                      background: selectedDevice?.address === dev.address ? 'var(--sel)' : 'rgba(255,255,255,0.03)',
                      border: selectedDevice?.address === dev.address ? '1px solid var(--ring)' : '1px solid var(--ctl-line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <b style={{ fontSize: 'var(--t-sm)', display: 'block' }}>{dev.name}</b>
                      <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>{dev.address}</span>
                    </div>
                    {selectedDevice?.address === dev.address && isConnected ? (
                      <span style={{ fontSize: 'var(--t-xs)', color: 'var(--accent-ink)', fontWeight: 800 }}>Aktif</span>
                    ) : (
                      <Button variant="flat" size="md" onClick={() => handleConnect(dev)} style={{ height: '32px', fontSize: 'var(--t-xs)' }}>
                        Pilih
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)', fontStyle: 'italic' }}>
                {selectedDevice ? `Menggunakan: ${selectedDevice.name}` : 'Belum ada perangkat terpilih. Tekan "Pindai Ulang".'}
              </span>
            )}
          </div>

          {/* Tombol Uji Cetak & Tutup */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <Button
              variant="flat"
              size="md"
              onClick={handleTestPrint}
              disabled={isPrinting || !isConnected}
              style={{ flex: 1 }}
            >
              {isPrinting ? 'Menguji...' : 'Uji Cetak'}
            </Button>
            <Button variant="lime" size="md" onClick={onClose} style={{ flex: 1 }}>
              Selesai
            </Button>
          </div>
        </div>
      </Sheet>

      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', bottom: '88px', left: '50%', transform: 'translateX(-50%)', zIndex: 100000, pointerEvents: 'none' }}>
          <Toast message={toastMessage} />
        </div>,
        document.getElementById('tk-portal-root') || document.body
      )}
    </>
  );
};
