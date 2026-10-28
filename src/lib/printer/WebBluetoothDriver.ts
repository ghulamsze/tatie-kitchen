import { PrinterDriver, PrinterDevice } from './types.ts';

// UUID standar layanan serial / data printer thermal BLE (ESC/POS)
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // VSC MP-58X, POS-58, MPT, GOOJPRT
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Bluetooth Serial
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Android / Mobile POS SPP BLE
];

// Type definitions minimal untuk Web Bluetooth API tanpa dependency eksternal
interface BluetoothCharacteristicProperties {
  write?: boolean;
  writeWithoutResponse?: boolean;
}

interface WebBluetoothCharacteristic {
  properties: BluetoothCharacteristicProperties;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
  writeValueWithResponse?(value: BufferSource): Promise<void>;
}

interface WebBluetoothService {
  getCharacteristics(): Promise<WebBluetoothCharacteristic[]>;
}

interface WebBluetoothServer {
  getPrimaryServices(): Promise<WebBluetoothService[]>;
  disconnect(): void;
}

interface WebBluetoothDevice {
  id: string;
  name?: string;
  gatt?: WebBluetoothServer & {
    connect(): Promise<WebBluetoothServer>;
    connected: boolean;
  };
  addEventListener(type: string, listener: () => void): void;
}

export class WebBluetoothDriver implements PrinterDriver {
  private device: WebBluetoothDevice | null = null;
  private characteristic: WebBluetoothCharacteristic | null = null;
  private connected = false;

  private getBluetooth(): any {
    return typeof navigator !== 'undefined' ? (navigator as any).bluetooth : undefined;
  }

  async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async listBondedDevices(): Promise<PrinterDevice[]> {
    const bluetooth = this.getBluetooth();
    if (!bluetooth) {
      throw new Error('Web Bluetooth tidak didukung pada browser ini.');
    }

    // Jika sudah ada perangkat yang tersimpan/terpilih
    if (this.device) {
      return [{
        name: this.device.name || 'Printer Bluetooth',
        address: this.device.id,
      }];
    }

    // Buka pemilih dialog asli browser untuk memilih printer thermal nyata
    try {
      const selected = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      if (selected) {
        this.device = selected;
        return [{
          name: selected.name || 'Printer Bluetooth',
          address: selected.id,
        }];
      }
    } catch (err: unknown) {
      // User membatalkan dialog atau bluetooth mati
      const errorMsg = (err as Error)?.message || '';
      if (errorMsg.includes('User cancelled')) {
        return [];
      }
      throw err;
    }

    return [];
  }

  async connect(address: string): Promise<boolean> {
    const bluetooth = this.getBluetooth();
    if (!bluetooth) {
      throw new Error('Web Bluetooth tidak didukung pada browser ini.');
    }

    try {
      // Jika belum memiliki referensi perangkat atau address berbeda, minta user memilih
      if (!this.device || this.device.id !== address) {
        this.device = await bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: PRINTER_SERVICES,
        });
      }

      if (!this.device || !this.device.gatt) {
        this.connected = false;
        return false;
      }

      const server = await this.device.gatt.connect();
      const services = await server.getPrimaryServices();

      // Cari characteristic yang mendukung operasi penulisan (write / writeWithoutResponse)
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.characteristic = char;
              this.connected = true;

              this.device.addEventListener('gattserverdisconnected', () => {
                this.connected = false;
                this.characteristic = null;
              });

              return true;
            }
          }
        } catch {
          // Lanjut ke service berikutnya jika service ini tidak dapat diakses
        }
      }

      this.connected = false;
      return false;
    } catch {
      this.connected = false;
      this.characteristic = null;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.connected = false;
    this.characteristic = null;
  }

  async isConnected(): Promise<boolean> {
    return Boolean(this.connected && this.device?.gatt?.connected && this.characteristic);
  }

  async printRaw(data: Uint8Array): Promise<boolean> {
    if (!this.characteristic || !this.device?.gatt?.connected) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }

    // Tulis data biner ESC/POS dalam potongan MTU 100 byte agar stabil di Bluetooth LE
    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      if (this.characteristic.properties.writeWithoutResponse && typeof this.characteristic.writeValueWithoutResponse === 'function') {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else if (typeof this.characteristic.writeValueWithResponse === 'function') {
        await this.characteristic.writeValueWithResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
    }

    return true;
  }
}
