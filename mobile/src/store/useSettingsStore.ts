import { create } from 'zustand';
import api from '../services/api';

interface SettingsState {
  darkMode: boolean;
  receiptWidth: 58 | 80;
  bluetoothPrinterName: string;
  bluetoothPrinterMac: string;
  autoPrintReceipt: boolean;
  isLoading: boolean;
  setDarkMode: (enabled: boolean) => void;
  setReceiptWidth: (width: 58 | 80) => void;
  setPrinter: (name: string, mac: string) => void;
  setAutoPrintReceipt: (enabled: boolean) => void;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  darkMode: false,
  receiptWidth: 58,
  bluetoothPrinterName: '',
  bluetoothPrinterMac: '',
  autoPrintReceipt: true,
  isLoading: false,

  setDarkMode: (darkMode) => set({ darkMode }),

  setReceiptWidth: (receiptWidth) => set({ receiptWidth }),

  setPrinter: (bluetoothPrinterName, bluetoothPrinterMac) =>
    set({ bluetoothPrinterName, bluetoothPrinterMac }),

  setAutoPrintReceipt: (autoPrintReceipt) => set({ autoPrintReceipt }),

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        set({
          darkMode: res.data.data.darkMode,
          autoPrintReceipt: res.data.data.autoPrintReceipt,
          isLoading: false,
        });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },
}));
