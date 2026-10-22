export interface PrinterDevice {
  name: string;
  address: string;
}

export interface PrinterStatus {
  connected: boolean;
  deviceName?: string;
  deviceAddress?: string;
}

export interface PrinterDriver {
  isAvailable(): Promise<boolean>;
  listBondedDevices(): Promise<PrinterDevice[]>;
  connect(address: string): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
  printRaw(data: Uint8Array): Promise<boolean>;
}
