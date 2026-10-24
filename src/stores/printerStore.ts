import { create } from 'zustand';
import { Capacitor } from '@capacitor/core';
import { PrinterDevice, PrinterDriver } from '../lib/printer/types.ts';
import { MockPreviewDriver } from '../lib/printer/MockPreviewDriver.ts';
import { CapacitorBluetoothDriver } from '../lib/printer/CapacitorBluetoothDriver.ts';
import { buildReceiptEscPos, buildTestEscPos } from '../lib/printer/escpos.ts';
import { Order, OrderItem } from '../lib/supabase/types.ts';
import { formatQueueNo } from '../lib/format/formatters.ts';
import { useShopStore } from './shopStore.ts';

interface PrinterState {
  driver: PrinterDriver;
  isConnected: boolean;
  selectedDevice: PrinterDevice | null;
  bondedDevices: PrinterDevice[];
  autoPrint: boolean;
  isScanning: boolean;
  isPrinting: boolean;
  lastPrintResult: { success: boolean; message: string; timestamp: number } | null;
  lastPrintedText: string | null;

  init: () => Promise<void>;
  scanBondedDevices: () => Promise<PrinterDevice[]>;
  connectDevice: (device: PrinterDevice) => Promise<boolean>;
  disconnectDevice: () => Promise<void>;
  setAutoPrint: (enabled: boolean) => void;
  printOrderReceipt: (order: Order, items: OrderItem[], cashierName: string, notes?: string) => Promise<boolean>;
  printTest: () => Promise<boolean>;
}

// Instansiasi driver sesuai platform (Capacitor Android Native vs Mock Web Browser)
const defaultDriver: PrinterDriver = Capacitor.isNativePlatform()
  ? new CapacitorBluetoothDriver()
  : new MockPreviewDriver();

export const usePrinterStore = create<PrinterState>((set, get) => {
  // Ambil konfigurasi lokal dari localStorage
  const savedAutoPrint = typeof window !== 'undefined'
    ? localStorage.getItem('tk-printer-autoprint') !== 'false'
    : true;

  const savedDeviceStr = typeof window !== 'undefined'
    ? localStorage.getItem('tk-printer-device')
    : null;

  let initialDevice: PrinterDevice | null = null;
  try {
    if (savedDeviceStr) {
      initialDevice = JSON.parse(savedDeviceStr);
    }
  } catch {
    initialDevice = null;
  }

  // Jika di mode mock (laptop/browser), berikan default device simulasi VSC MP-58X
  if (!Capacitor.isNativePlatform() && !initialDevice) {
    initialDevice = {
      name: 'VSC MP-58X',
      address: '00:11:22:33:44:55',
    };
  }

  return {
    driver: defaultDriver,
    isConnected: !Capacitor.isNativePlatform(), // Mock driver langsung terhubung
    selectedDevice: initialDevice,
    bondedDevices: [],
    autoPrint: savedAutoPrint,
    isScanning: false,
    isPrinting: false,
    lastPrintResult: null,
    lastPrintedText: null,

    init: async () => {
      const { driver, selectedDevice } = get();
      try {
        const available = await driver.isAvailable();
        if (available && selectedDevice) {
          const connected = await driver.connect(selectedDevice.address);
          set({ isConnected: connected });
        }
      } catch {
        set({ isConnected: false });
      }
    },

    scanBondedDevices: async () => {
      const { driver } = get();
      set({ isScanning: true });
      try {
        const devices = await driver.listBondedDevices();
        set({ bondedDevices: devices, isScanning: false });
        return devices;
      } catch (err) {
        set({ isScanning: false });
        throw err;
      }
    },

    connectDevice: async (device: PrinterDevice) => {
      const { driver } = get();
      try {
        const success = await driver.connect(device.address);
        if (success) {
          set({ selectedDevice: device, isConnected: true });
          if (typeof window !== 'undefined') {
            localStorage.setItem('tk-printer-device', JSON.stringify(device));
          }
          return true;
        }
        set({ isConnected: false });
        return false;
      } catch (err: unknown) {
        set({ isConnected: false });
        throw err;
      }
    },

    disconnectDevice: async () => {
      const { driver } = get();
      try {
        await driver.disconnect();
      } finally {
        set({ isConnected: false });
      }
    },

    setAutoPrint: (enabled: boolean) => {
      set({ autoPrint: enabled });
      if (typeof window !== 'undefined') {
        localStorage.setItem('tk-printer-autoprint', String(enabled));
      }
    },

    printOrderReceipt: async (order: Order, items: OrderItem[], cashierName: string, notes?: string) => {
      const { driver, isConnected } = get();
      if (!isConnected) {
        set({
          lastPrintResult: {
            success: false,
            message: 'Printer Bluetooth belum terhubung.',
            timestamp: Date.now(),
          },
        });
        return false;
      }

      set({ isPrinting: true });
      try {
        const shop = useShopStore.getState().shop;
        const bytes = buildReceiptEscPos({
          order,
          items,
          cashierName,
          notes,
          shopName: shop.name,
          shopAddress: shop.address,
        });

        const success = await driver.printRaw(bytes);
        set({
          isPrinting: false,
          lastPrintResult: {
            success: true,
            message: `Struk antrian #${formatQueueNo(order.queue_no)} berhasil dicetak!`,
            timestamp: Date.now(),
          },
        });
        return success;
      } catch (err: unknown) {
        const errMsg = (err as Error)?.message || 'Gagal mencetak struk';
        set({
          isPrinting: false,
          lastPrintResult: {
            success: false,
            message: errMsg,
            timestamp: Date.now(),
          },
        });
        return false;
      }
    },

    printTest: async () => {
      const { driver, isConnected } = get();
      if (!isConnected) {
        set({
          lastPrintResult: {
            success: false,
            message: 'Printer belum terhubung.',
            timestamp: Date.now(),
          },
        });
        return false;
      }

      set({ isPrinting: true });
      try {
        const bytes = buildTestEscPos();
        const success = await driver.printRaw(bytes);
        set({
          isPrinting: false,
          lastPrintResult: {
            success: true,
            message: 'Uji cetak berhasil terkirim ke printer VSC MP-58X.',
            timestamp: Date.now(),
          },
        });
        return success;
      } catch (err: unknown) {
        const errMsg = (err as Error)?.message || 'Uji cetak gagal';
        set({
          isPrinting: false,
          lastPrintResult: {
            success: false,
            message: errMsg,
            timestamp: Date.now(),
          },
        });
        return false;
      }
    },
  };
});
