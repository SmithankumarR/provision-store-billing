/**
 * BLE Thermal Printer Service wrapper using react-native-ble-plx
 * Scans, connects, and writes ESC/POS command buffers to Bluetooth printers.
 */
import { BleManager, Device } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

class BlePrinterService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;

  constructor() {
    try {
      this.manager = new BleManager();
    } catch (e) {
      console.warn('BLE Manager unavailable in this environment');
    }
  }

  /**
   * Scan for nearby Bluetooth thermal printers
   */
  public async scanForPrinters(onDeviceFound: (device: Device) => void): Promise<void> {
    if (!this.manager) return;

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('BLE Scan Error:', error.message);
        return;
      }
      if (device && (device.name || device.localName)) {
        onDeviceFound(device);
      }
    });

    // Stop scan after 10 seconds
    setTimeout(() => {
      this.stopScan();
    }, 10000);
  }

  public stopScan(): void {
    if (this.manager) {
      this.manager.stopDeviceScan();
    }
  }

  /**
   * Connect to Bluetooth device
   */
  public async connect(deviceId: string): Promise<Device | null> {
    if (!this.manager) return null;

    this.stopScan();
    try {
      const device = await this.manager.connectToDevice(deviceId);
      const connected = await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = connected;
      return connected;
    } catch (error: any) {
      console.error('BLE Connection Error:', error.message);
      throw error;
    }
  }

  /**
   * Write ESC/POS byte buffer to Bluetooth thermal printer
   */
  public async printBytes(bytes: Uint8Array): Promise<boolean> {
    if (!this.connectedDevice) {
      console.warn('No Bluetooth printer connected. Simulating print output...');
      return true;
    }

    try {
      const base64Data = Buffer.from(bytes).toString('base64');
      const services = await this.connectedDevice.services();

      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const char of characteristics) {
          if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
            if (char.isWritableWithoutResponse) {
              await char.writeWithoutResponse(base64Data);
            } else {
              await char.writeWithResponse(base64Data);
            }
            return true;
          }
        }
      }
      return false;
    } catch (error: any) {
      console.error('BLE Print Transmission Error:', error.message);
      return false;
    }
  }

  public disconnect(): void {
    if (this.connectedDevice) {
      this.connectedDevice.cancelConnection().catch(() => {});
      this.connectedDevice = null;
    }
  }
}

export default new BlePrinterService();
