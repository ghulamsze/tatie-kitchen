import { Capacitor, registerPlugin } from '@capacitor/core';
import { PrinterDriver, PrinterDevice } from './types.ts';

interface BluetoothPrinterPluginInterface {
  isAvailable(): Promise<{ available: boolean }>;
  listBondedDevices(): Promise<{ devices: Array<{ name: string; address: string }> }>;
  connect(options: { address: string }): Promise<{ connected: boolean }>;
  disconnect(): Promise<{ connected: boolean }>;
  isConnected(): Promise<{ connected: boolean }>;
  printRaw(options: { data: string }): Promise<{ success: boolean }>;
}

const BluetoothPrinter = registerPlugin<BluetoothPrinterPluginInterface>('BluetoothPrinter');

export class CapacitorBluetoothDriver implements PrinterDriver {
  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    try {
      const res = await BluetoothPrinter.isAvailable();
      return Boolean(res?.available);
    } catch {
      return false;
    }
  }

  async listBondedDevices(): Promise<PrinterDevice[]> {
    if (!Capacitor.isNativePlatform()) {
      return [];
    }
    try {
      const res = await BluetoothPrinter.listBondedDevices();
      return res?.devices || [];
    } catch {
      return [];
    }
  }

  async connect(address: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    const res = await BluetoothPrinter.connect({ address });
    return Boolean(res?.connected);
  }

  async disconnect(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    await BluetoothPrinter.disconnect();
  }

  async isConnected(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    try {
      const res = await BluetoothPrinter.isConnected();
      return Boolean(res?.connected);
    } catch {
      return false;
    }
  }

  async printRaw(data: Uint8Array): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Pencetakan Bluetooth native hanya tersedia pada aplikasi APK Android.');
    }

    // Ubah Uint8Array menjadi string Base64 yang aman untuk transfer bridge
    let binary = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(data[i]);
    }
    const base64Data = btoa(binary);

    const res = await BluetoothPrinter.printRaw({ data: base64Data });
    return Boolean(res?.success);
  }
}
