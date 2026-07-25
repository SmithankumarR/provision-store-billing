import Store, { IStore } from '../models/Store';
import Settings, { ISettings } from '../models/Settings';
import { ApiError } from '../middlewares/errorHandler';

export const getStoreProfile = async (storeId: string): Promise<IStore> => {
  const store = await Store.findById(storeId);
  if (!store) {
    throw new ApiError('Store profile not found.', 404);
  }
  return store;
};

export const updateStoreProfile = async (
  storeId: string,
  data: Partial<IStore>
): Promise<IStore> => {
  const store = await Store.findById(storeId);
  if (!store) {
    throw new ApiError('Store profile not found.', 404);
  }

  if (data.name) store.name = data.name.trim();
  if (data.address) store.address = data.address.trim();
  if (data.phone) store.phone = data.phone.trim();
  if (data.gstNumber !== undefined) store.gstNumber = data.gstNumber.trim();
  if (data.footerMessage !== undefined) store.footerMessage = data.footerMessage.trim();
  if (data.logoUrl !== undefined) store.logoUrl = data.logoUrl.trim();
  if (data.currency) store.currency = data.currency;
  if (data.taxPercentage !== undefined) store.taxPercentage = data.taxPercentage;
  if (data.receiptWidth) store.receiptWidth = data.receiptWidth;
  if (data.bluetoothPrinterName !== undefined) store.bluetoothPrinterName = data.bluetoothPrinterName.trim();
  if (data.defaultDiscount !== undefined) store.defaultDiscount = data.defaultDiscount;

  return await store.save();
};

export const getAppSettings = async (storeId: string): Promise<ISettings> => {
  let settings = await Settings.findOne({ storeId });
  if (!settings) {
    settings = await Settings.create({ storeId });
  }
  return settings;
};

export const updateAppSettings = async (
  storeId: string,
  data: Partial<ISettings>
): Promise<ISettings> => {
  let settings = await Settings.findOne({ storeId });
  if (!settings) {
    settings = new Settings({ storeId });
  }

  if (data.darkMode !== undefined) settings.darkMode = data.darkMode;
  if (data.language) settings.language = data.language;
  if (data.autoPrintReceipt !== undefined) settings.autoPrintReceipt = data.autoPrintReceipt;
  if (data.enableSound !== undefined) settings.enableSound = data.enableSound;
  if (data.lowStockNotification !== undefined) settings.lowStockNotification = data.lowStockNotification;

  return await settings.save();
};
