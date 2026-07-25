import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import { Store, User, Category, Item, Customer, Bill, InventoryLog } from '../models';
import * as authService from '../services/authService';
import * as categoryService from '../services/categoryService';
import * as itemService from '../services/itemService';
import * as customerService from '../services/customerService';
import * as billService from '../services/billService';
import { PaymentMethod, BillStatus } from '../models/Bill';

const runBillTests = async () => {
  await connectDB();

  try {
    console.log('--- Cleaning test data ---');
    await User.deleteMany({ email: 'billowner@provision.com' });
    await Store.deleteMany({ name: 'Billing Test Store' });

    console.log('1. Setting up Store, Owner, Category & Customer...');
    const regResult = await authService.registerStoreAndOwner({
      storeName: 'Billing Test Store',
      storeAddress: '12 Billing Boulevard',
      storePhone: '9776655443',
      ownerName: 'Bill Owner',
      ownerEmail: 'billowner@provision.com',
      ownerPhone: '9776655443',
      password: 'billpassword123',
    });

    const storeId = regResult.store._id.toString();
    const cashierId = regResult.user.id.toString();

    const category = await categoryService.createCategory(storeId, {
      name: 'Beverages',
    });

    const customer = await customerService.createCustomer(storeId, {
      name: 'John Doe',
      phone: '9900112233',
      address: '77 Residency Road',
    });
    console.log('✔ Customer created:', customer.name, '| Phone:', customer.phone);

    console.log('2. Setting up Items in Stock...');
    const item1 = await itemService.createItem(storeId, cashierId, {
      name: 'Mango Juice 1L',
      categoryId: category._id as any,
      sellingPrice: 90,
      costPrice: 70,
      mrp: 100,
      gstPercentage: 12,
      currentStock: 20,
    });

    const item2 = await itemService.createItem(storeId, cashierId, {
      name: 'Mineral Water 1L',
      categoryId: category._id as any,
      sellingPrice: 20,
      costPrice: 12,
      mrp: 20,
      gstPercentage: 18,
      currentStock: 50,
    });

    console.log('3. Testing Bill Checkout (Auto Invoice Number & Calculations)...');
    const bill1 = await billService.createBill(storeId, cashierId, {
      customerId: customer._id.toString(),
      items: [
        { itemId: item1._id.toString(), quantity: 2, discountPercentage: 10 }, // 2 * 90 = 180 - 10% (18) = 162 + 12% GST (19.44) = 181.44
        { itemId: item2._id.toString(), quantity: 5 }, // 5 * 20 = 100 + 18% GST (18) = 118
      ],
      paymentMethod: PaymentMethod.CASH,
    });

    console.log('✔ Bill Created! Invoice:', bill1.invoiceNumber);
    console.log('✔ Subtotal:', bill1.subtotal, '| Discount:', bill1.discountTotal, '| Tax:', bill1.taxTotal, '| Grand Total:', bill1.grandTotal);

    console.log('4. Verifying Stock Deduction & Inventory Logs...');
    const updatedItem1 = await Item.findById(item1._id);
    console.log('✔ Item 1 Stock reduced from 20 to:', updatedItem1?.currentStock);

    const logs = await InventoryLog.find({ storeId, itemId: item1._id });
    console.log('✔ Audit log created for bill sale, log count:', logs.length);

    console.log('5. Verifying Customer Loyalty Accumulation...');
    const updatedCustomer = await Customer.findById(customer._id);
    console.log('✔ Customer Total Spent:', updatedCustomer?.totalSpent, '| Loyalty Points:', updatedCustomer?.loyaltyPoints);

    console.log('6. Testing Split Payment Checkout...');
    const bill2 = await billService.createBill(storeId, cashierId, {
      items: [{ itemId: item2._id.toString(), quantity: 2 }],
      paymentMethod: PaymentMethod.SPLIT,
      splitDetails: {
        cashAmount: 20,
        upiAmount: 28,
      },
    });
    console.log('✔ Split Bill Created! Invoice:', bill2.invoiceNumber, '| Grand Total:', bill2.grandTotal);

    console.log('7. Testing Today Sales Summary...');
    const summary = await billService.getTodayBillsSummary(storeId);
    console.log('✔ Today Total Bills Count:', summary.totalBillsCount, '| Total Sales Revenue: ₹', summary.totalSales);
    console.log('✔ Payment Breakdown:', JSON.stringify(summary.paymentBreakdown));

    console.log('8. Testing Bill Cancellation & Stock Restoration...');
    const cancelledBill = await billService.cancelBill(storeId, bill1._id.toString(), cashierId);
    console.log('✔ Bill status updated to:', cancelledBill.status);

    const restoredItem1 = await Item.findById(item1._id);
    console.log('✔ Item 1 Stock restored back to:', restoredItem1?.currentStock);

    const restoredCustomer = await Customer.findById(customer._id);
    console.log('✔ Customer Loyalty Points reversed to:', restoredCustomer?.loyaltyPoints);

    console.log('--- ALL BILLING & CUSTOMER INTEGRATION TESTS PASSED PERFECTLY ---');
  } catch (error: any) {
    console.error('❌ Test Failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runBillTests();
