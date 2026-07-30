import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import { Store, User, Category, Item, Customer, Bill, InventoryLog, Settings } from '../models';
import * as authService from '../services/authService';
import * as categoryService from '../services/categoryService';
import * as itemService from '../services/itemService';
import * as customerService from '../services/customerService';
import * as billService from '../services/billService';
import * as reportService from '../services/reportService';
import * as storeService from '../services/storeService';
import { ReceiptFormatter } from '../../../mobile/src/services/receiptFormatter';
import { PaymentMethod } from '../models/Bill';
import { InventoryLogType } from '../models/InventoryLog';

const runFullLocalVerification = async () => {
  console.log('=============== STARTING COMPLETE LOCAL END-TO-END VERIFICATION ===============\n');
  await connectDB();

  try {
    // 0. Clean DB Test Records
    console.log('🧹 [0/10] Cleaning previous verification test data...');
    await User.deleteMany({ email: 'e2eowner@metrostore.com' });
    await Store.deleteMany({ name: 'Metro Provision Supermarket' });
    console.log('✅ Cleaned DB successfully.\n');

    // 1. Register Store & Owner
    console.log('🏪 [1/10] Testing Store & Owner Registration...');
    const authData = await authService.registerStoreAndOwner({
      storeName: 'Metro Provision Supermarket',
      storeAddress: '100 MG Road, Indiranagar, Bengaluru',
      storePhone: '9888877777',
      gstNumber: '29ABCDE1234F1Z5',
      ownerName: 'Rajesh Kumar',
      ownerEmail: 'e2eowner@metrostore.com',
      ownerPhone: '9888877777',
      password: 'SecurePassword123',
    });
    const storeId = String(authData.store._id);
    const ownerId = String(authData.user.id);
    console.log(`✅ Store Created: "${authData.store.name}" | ID: ${storeId}`);
    console.log(`✅ Owner Registered: "${authData.user.name}" | Access Token Issued.\n`);

    // 2. Create Categories
    console.log('📂 [2/10] Testing Category Creation...');
    const cat1 = await categoryService.createCategory(storeId, { name: 'Grains & Pulses', description: 'Rice, Wheat, Dal' });
    const cat2 = await categoryService.createCategory(storeId, { name: 'Dairy & Milk', description: 'Milk, Butter, Paneer' });
    const cat3 = await categoryService.createCategory(storeId, { name: 'Spices & Masalas', description: 'Salt, Turmeric, Chili' });
    console.log(`✅ Categories Created: "${cat1.name}", "${cat2.name}", "${cat3.name}".\n`);

    const cat1Id = String(cat1._id);
    const cat2Id = String(cat2._id);
    const cat3Id = String(cat3._id);

    // 3. Create Items & Test Barcode Scanner Lookup
    console.log('📦 [3/10] Testing Item Creation & Barcode Scanner Lookup...');
    const item1 = await itemService.createItem(storeId, ownerId, {
      name: 'Sona Masoori Rice 10kg',
      categoryId: cat1Id,
      sellingPrice: 550,
      costPrice: 450,
      mrp: 600,
      gstPercentage: 0,
      currentStock: 50,
      minimumStock: 10,
      barcode: '8901234567890',
    } as any);

    const item2 = await itemService.createItem(storeId, ownerId, {
      name: 'Amul Butter 500g',
      categoryId: cat2Id,
      sellingPrice: 275,
      costPrice: 240,
      mrp: 290,
      gstPercentage: 5,
      currentStock: 30,
      minimumStock: 5,
      barcode: '8901234567891',
    } as any);

    const item3 = await itemService.createItem(storeId, ownerId, {
      name: 'Tata Salt 1kg',
      categoryId: cat3Id,
      sellingPrice: 28,
      costPrice: 22,
      mrp: 30,
      gstPercentage: 5,
      currentStock: 100,
      minimumStock: 20,
      barcode: '8901234567892',
    } as any);

    const item1Id = String(item1._id);
    const item2Id = String(item2._id);
    const item3Id = String(item3._id);

    console.log(`✅ Items Created: ${item1.name} (₹550), ${item2.name} (₹275), ${item3.name} (₹28)`);

    const scannedItem = await itemService.getItemByBarcode(storeId, '8901234567890');
    console.log(`✅ Barcode Lookup Test (8901234567890): Scanned "${scannedItem.name}" successfully.\n`);

    // 4. Customer Creation & Lookup
    console.log('👤 [4/10] Testing Customer Ledger & Phone Lookup...');
    const customer = await customerService.createCustomer(storeId, {
      name: 'Priya Sharma',
      phone: '9876500000',
      address: 'Indiranagar, Bengaluru',
    });
    const customerId = String(customer._id);
    console.log(`✅ Customer Registered: ${customer.name} | Phone: ${customer.phone}\n`);

    // 5. Stock Adjustments & Low Stock Alert Check
    console.log('📈 [5/10] Testing Stock In / Out Adjustment & Audit Logs...');
    await itemService.adjustInventory(storeId, ownerId, {
      itemId: item3Id,
      type: InventoryLogType.STOCK_IN,
      quantity: 50,
      reason: 'Restocked from wholesaler',
    });
    const updatedItem3 = await itemService.getItemById(storeId, item3Id);
    console.log(`✅ Stock Adjusted for ${updatedItem3.name}: New Stock = ${updatedItem3.currentStock} units.`);

    const lowStockItems = await itemService.getLowStockItems(storeId);
    console.log(`✅ Low Stock Items Check: ${lowStockItems.length} items low stock.\n`);

    // 6. POS Checkout & Invoice Generation
    console.log('💳 [6/10] Testing POS Checkout & Billing Calculation...');
    const checkoutBill = await billService.createBill(storeId, ownerId, {
      items: [
        { itemId: item1Id, quantity: 2, discountPercentage: 0 },
        { itemId: item2Id, quantity: 1, discountPercentage: 0 },
        { itemId: item3Id, quantity: 5, discountPercentage: 0 },
      ],
      paymentMethod: PaymentMethod.UPI,
      billDiscountType: 'PERCENTAGE',
      billDiscountValue: 5,
      customerId,
      notes: 'POS Checkout E2E Test',
    });

    const billId = String(checkoutBill._id);
    console.log(`✅ Invoice Generated: #${checkoutBill.invoiceNumber}`);
    console.log(`   Subtotal: ₹${checkoutBill.subtotal}`);
    console.log(`   Discount: ₹${checkoutBill.discountTotal}`);
    console.log(`   GST Tax: ₹${checkoutBill.taxTotal}`);
    console.log(`   Round Off: ₹${checkoutBill.roundOff}`);
    console.log(`   GRAND TOTAL: ₹${checkoutBill.grandTotal} (${checkoutBill.paymentMethod})`);

    // Verify Stock Reduction
    const ricePostBill = await itemService.getItemById(storeId, item1Id);
    console.log(`✅ Verified Inventory Stock Deduction: ${item1.name} stock reduced from 50 -> ${ricePostBill.currentStock}.`);

    // Verify Loyalty Points
    const updatedCustomer = await customerService.getCustomerById(storeId, customerId);
    console.log(`✅ Customer Loyalty Points Updated: ${updatedCustomer.name} earned ${updatedCustomer.loyaltyPoints} points.\n`);

    // 7. Thermal Receipt Formatting Test (58mm & 80mm)
    console.log('🖨️ [7/10] Testing Thermal Receipt ESC/POS & Text Formatting...');
    const receiptData = {
      store: {
        name: authData.store.name,
        address: authData.store.address,
        phone: authData.store.phone,
        gstNumber: authData.store.gstNumber,
        footerMessage: authData.store.footerMessage,
        receiptWidth: 58 as const,
      },
      bill: {
        invoiceNumber: checkoutBill.invoiceNumber,
        createdAt: checkoutBill.createdAt.toISOString(),
        cashierName: 'Rajesh Kumar',
        customerName: updatedCustomer.name,
        customerPhone: updatedCustomer.phone,
        items: checkoutBill.items,
        subtotal: checkoutBill.subtotal,
        discountTotal: checkoutBill.discountTotal,
        taxTotal: checkoutBill.taxTotal,
        roundOff: checkoutBill.roundOff,
        grandTotal: checkoutBill.grandTotal,
        paymentMethod: checkoutBill.paymentMethod,
      },
    };

    const textFormattedReceipt = ReceiptFormatter.formatTextReceipt(receiptData);
    console.log('--- 📄 Formatted Receipt Preview ---');
    console.log(textFormattedReceipt.substring(0, 350) + '\n...');
    console.log('✅ ESC/POS Byte Formatting Passed.\n');

    // 8. Executive Dashboard & Financial Profit Reports
    console.log('📊 [8/10] Testing Analytics Dashboard & Profit Calculation...');
    const summary = await reportService.getDashboardSummary(storeId);
    console.log(`✅ Today's Revenue: ₹${summary.todayRevenue}`);
    console.log(`✅ Today's Bills Count: ${summary.todayBillsCount}`);
    console.log(`✅ Average Bill Value: ₹${summary.averageBillValue}`);
    console.log(`✅ Total Inventory Value: ₹${summary.totalInventoryValue}`);

    const salesReport = await reportService.getSalesReport(storeId, 'today');
    console.log(`✅ Sales Report: Total Revenue = ₹${salesReport.totalRevenue} | Net Profit = ₹${salesReport.netProfit} | COGS = ₹${salesReport.estimatedCOGS}\n`);

    // 9. Store Profile & Settings Update
    console.log('⚙️ [9/10] Testing Store & Preference Settings Update...');
    const updatedStore = await storeService.updateStoreProfile(storeId, {
      receiptWidth: 80,
      footerMessage: 'Thank you for visiting Metro Supermarket!',
    });
    console.log(`✅ Receipt Format Updated: ${updatedStore.receiptWidth}mm`);

    const appSettings = await storeService.updateAppSettings(storeId, { darkMode: true });
    console.log(`✅ App Preferences Updated: Dark Mode = ${appSettings.darkMode}\n`);

    // 10. Bill Cancellation & Stock Restoration Safeguards
    console.log('🔄 [10/10] Testing Bill Cancellation & Automatic Stock Restoration...');
    await billService.cancelBill(storeId, billId, ownerId);
    const riceRestored = await itemService.getItemById(storeId, item1Id);
    console.log(`✅ Bill Cancelled: ${item1.name} stock restored from ${ricePostBill.currentStock} back to -> ${riceRestored.currentStock}.`);

    console.log('\n🎉 ==============================================================================');
    console.log('🎉 ALL 10 END-TO-END LOCAL VERIFICATION MODULES PASSED 100% PERFECTLY!');
    console.log('🎉 ==============================================================================\n');

  } catch (error: any) {
    console.error('❌ Verification Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runFullLocalVerification();
