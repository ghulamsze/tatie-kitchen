import { PrinterDriver, PrinterDevice } from './types.ts';
import { decodeEscPosToText } from './escpos.ts';

export class MockPreviewDriver implements PrinterDriver {
  private connectedDevice: PrinterDevice | null = {
    name: 'VSC MP-58X',
    address: '00:11:22:33:44:55',
  };
  private isDeviceConnected = true;
  public lastPrintedBytes: Uint8Array | null = null;
  public lastPrintedText = '';

  getConnectedDevice(): PrinterDevice | null {
    return this.connectedDevice;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async listBondedDevices(): Promise<PrinterDevice[]> {
    return [
      { name: 'VSC MP-58X', address: '00:11:22:33:44:55' },
      { name: 'RPP02N Thermal Printer', address: 'AA:BB:CC:DD:EE:FF' },
    ];
  }

  async connect(address: string): Promise<boolean> {
    this.isDeviceConnected = true;
    this.connectedDevice = {
      name: address === '00:11:22:33:44:55' ? 'VSC MP-58X' : 'Printer Thermal',
      address,
    };
    return true;
  }

  async disconnect(): Promise<void> {
    this.isDeviceConnected = false;
    this.connectedDevice = null;
  }

  async isConnected(): Promise<boolean> {
    return this.isDeviceConnected;
  }

  async printRaw(data: Uint8Array): Promise<boolean> {
    if (!this.isDeviceConnected) {
      throw new Error('Printer belum terhubung.');
    }

    this.lastPrintedBytes = data;
    this.lastPrintedText = decodeEscPosToText(data);

    // Kirim event browser agar UI bisa menampilkan toast/notifikasi cetak di laptop beta
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tk-printer-printed', {
          detail: {
            text: this.lastPrintedText,
            bytesCount: data.length,
          },
        })
      );
    }

    return true;
  }
}
