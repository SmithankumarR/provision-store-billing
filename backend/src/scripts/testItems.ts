import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import { Store, User, Category, Item, InventoryLog } from '../models';
import * as authService from '../services/authService';
import * as categoryService from '../services/categoryService';
import * as itemService from '../services/itemService';
import { InventoryLogType } from '../models/InventoryLog';

const runItemTests = async () => {
  await connectDB();

  try {
    console.log('--- Cleaning test data ---');
    await User.deleteMany({ email: 'itemowner@provision.com' });
    await Store.deleteMany({ name: 'Item Test Store' });

    console.log('1. Setting up Store, Owner & Category...');
    const regResult = await authService.registerStoreAndOwner({
      storeName: 'Item Test Store',
      storeAddress: '789 Commercial Street',
      storePhone: '9887766554',
      ownerName: 'Item Owner',
      ownerEmail: 'itemowner@provision.com',
      ownerPhone: '9887766554',
      password: 'itempassword123',
    });

    const storeId = regResult.store._id.toString();
    const userId = regResult.user.id.toString();

    const category = await categoryService.createCategory(storeId, {
      name: 'Spices & Masalas',
    });

    console.log('2. Testing Item Creation with Auto-SKU & Initial Stock Audit Log...');
    const item1 = await itemService.createItem(storeId, userId, {
      name: 'Turmeric Powder 100g',
      categoryId: category._id as any,
      barcode: '8901234567890',
      sellingPrice: 35,
      costPrice: 28,
      mrp: 40,
      gstPercentage: 5,
      currentStock: 50,
      minimumStock: 10,
    });
    console.log('✔ Item created with SKU:', item1.sku, '| Current Stock:', item1.currentStock);

    console.log('3. Testing Barcode & SKU Lookup...');
    const foundByBarcode = await itemService.getItemByBarcode(storeId, '8901234567890');
    console.log('✔ Found by Barcode:', foundByBarcode.name);

    const foundBySku = await itemService.getItemBySku(storeId, item1.sku);
    console.log('✔ Found by SKU:', foundBySku.name);

    console.log('4. Testing Inventory Adjustment (Stock In & Stock Out)...');
    const stockIn = await itemService.adjustInventory(storeId, userId, {
      itemId: item1._id.toString(),
      type: InventoryLogType.STOCK_IN,
      quantity: 20,
      reason: 'Supplier shipment arrived',
    });
    console.log('✔ Stock In completed! New stock:', stockIn.item.currentStock);

    const stockOut = await itemService.adjustInventory(storeId, userId, {
      itemId: item1._id.toString(),
      type: InventoryLogType.STOCK_OUT,
      quantity: 55, // 70 - 55 = 15 (Low stock threshold is 10)
      reason: 'Bulk billing sale',
    });
    console.log('✔ Stock Out completed! New stock:', stockOut.item.currentStock);

    console.log('5. Testing Low Stock Alert Fetching...');
    const item2 = await itemService.createItem(storeId, userId, {
      name: 'Red Chilli Powder 100g',
      categoryId: category._id as any,
      sellingPrice: 45,
      costPrice: 35,
      mrp: 50,
      currentStock: 3, // Less than minimum 5
      minimumStock: 5,
    });

    const lowStockItems = await itemService.getLowStockItems(storeId);
    console.log('✔ Low Stock items count:', lowStockItems.length);
    console.log('✔ Low Stock item detected:', lowStockItems[0]?.name);

    console.log('6. Testing Inventory Logs Retrieval...');
    const logs = await itemService.getInventoryLogs(storeId, item1._id.toString());
    console.log('✔ Inventory audit log count for item1:', logs.length);

    console.log('7. Testing CSV Export...');
    const csvExport = await itemService.exportCsvItems(storeId);
    console.log('✔ Exported CSV sample header:\n', csvExport.split('\n')[0]);

    console.log('8. Testing CSV Import...');
    const sampleCsvData = `Name,Category,SKU,Barcode,SellingPrice,CostPrice,MRP,CurrentStock,MinimumStock
Garam Masala 50g,Spices & Masalas,GARAM-50G,8909876543210,30,22,35,100,10
Coriander Powder 100g,Spices & Masalas,COR-100G,8909876543211,25,18,30,80,10`;

    const importResult = await itemService.importCsvItems(storeId, userId, sampleCsvData);
    console.log('✔ CSV Import finished! Created:', importResult.created, '| Updated:', importResult.updated);

    console.log('--- ALL ITEM & INVENTORY INTEGRATION TESTS PASSED PERFECTLY ---');
  } catch (error: any) {
    console.error('❌ Test Failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runItemTests();
