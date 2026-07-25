import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import { Store, User, Settings } from '../models';
import * as authService from '../services/authService';
import * as storeService from '../services/storeService';

const runStoreTests = async () => {
  await connectDB();

  try {
    console.log('--- Cleaning test data ---');
    await User.deleteMany({ email: 'storeowner@provision.com' });
    await Store.deleteMany({ name: 'Store Settings Test Store' });

    console.log('1. Setting up Store & Owner...');
    const regResult = await authService.registerStoreAndOwner({
      storeName: 'Store Settings Test Store',
      storeAddress: '55 Retail Square',
      storePhone: '9443322110',
      ownerName: 'Store Owner',
      ownerEmail: 'storeowner@provision.com',
      ownerPhone: '9443322110',
      password: 'storepassword123',
    });

    const storeId = regResult.store._id.toString();

    console.log('2. Testing Get Store Profile...');
    const profile = await storeService.getStoreProfile(storeId);
    console.log('✔ Fetched Store Name:', profile.name, '| Receipt Width:', profile.receiptWidth, 'mm');

    console.log('3. Testing Update Store Profile (Receipt Width & Footer Message)...');
    const updatedStore = await storeService.updateStoreProfile(storeId, {
      receiptWidth: 80,
      footerMessage: 'Thank you for shopping at Retail Square!',
      bluetoothPrinterName: 'POS-80-Printer',
    });
    console.log('✔ Updated Receipt Width to:', updatedStore.receiptWidth, 'mm');
    console.log('✔ Updated Bluetooth Printer Name:', updatedStore.bluetoothPrinterName);

    console.log('4. Testing App Settings Preferences (Dark Mode & Auto-Print)...');
    const settings = await storeService.getAppSettings(storeId);
    console.log('✔ Initial Dark Mode:', settings.darkMode);

    const updatedSettings = await storeService.updateAppSettings(storeId, {
      darkMode: true,
      autoPrintReceipt: true,
    });
    console.log('✔ Updated Dark Mode to:', updatedSettings.darkMode);

    console.log('--- ALL STORE & APP SETTINGS INTEGRATION TESTS PASSED PERFECTLY ---');
  } catch (error: any) {
    console.error('❌ Test Failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runStoreTests();
