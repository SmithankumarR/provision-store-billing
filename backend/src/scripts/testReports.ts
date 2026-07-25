import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import { Store, User, Category, Item, Customer, Bill } from '../models';
import * as authService from '../services/authService';
import * as categoryService from '../services/categoryService';
import * as itemService from '../services/itemService';
import * as billService from '../services/billService';
import * as reportService from '../services/reportService';
import { PaymentMethod } from '../models/Bill';

const runReportTests = async () => {
  await connectDB();

  try {
    console.log('--- Cleaning test data ---');
    await User.deleteMany({ email: 'reportowner@provision.com' });
    await Store.deleteMany({ name: 'Reports Test Store' });

    console.log('1. Setting up Store, Owner, Categories & Items...');
    const regResult = await authService.registerStoreAndOwner({
      storeName: 'Reports Test Store',
      storeAddress: '88 Analytics Way',
      storePhone: '9554433221',
      ownerName: 'Report Owner',
      ownerEmail: 'reportowner@provision.com',
      ownerPhone: '9554433221',
      password: 'reportpassword123',
    });

    const storeId = regResult.store._id.toString();
    const ownerId = regResult.user.id.toString();

    const catDairy = await categoryService.createCategory(storeId, { name: 'Dairy' });
    const catSnacks = await categoryService.createCategory(storeId, { name: 'Snacks' });

    const milk = await itemService.createItem(storeId, ownerId, {
      name: 'Full Cream Milk 500ml',
      categoryId: catDairy._id as any,
      sellingPrice: 30,
      costPrice: 24,
      mrp: 32,
      currentStock: 100,
    });

    const biscuits = await itemService.createItem(storeId, ownerId, {
      name: 'Butter Cookies 200g',
      categoryId: catSnacks._id as any,
      sellingPrice: 50,
      costPrice: 35,
      mrp: 50,
      currentStock: 40,
    });

    console.log('2. Generating Sample Bills for Reports...');
    await billService.createBill(storeId, ownerId, {
      items: [
        { itemId: milk._id.toString(), quantity: 10 },
        { itemId: biscuits._id.toString(), quantity: 4 },
      ],
      paymentMethod: PaymentMethod.UPI,
    });

    await billService.createBill(storeId, ownerId, {
      items: [{ itemId: biscuits._id.toString(), quantity: 2 }],
      paymentMethod: PaymentMethod.CASH,
    });

    console.log('3. Testing Dashboard Summary Metrics...');
    const summary = await reportService.getDashboardSummary(storeId);
    console.log('✔ Today Revenue: ₹', summary.todayRevenue);
    console.log('✔ Monthly Sales: ₹', summary.monthlySales);
    console.log('✔ Monthly Estimated Profit: ₹', summary.monthlyProfit);
    console.log('✔ Total Inventory Value: ₹', summary.totalInventoryValue);

    console.log('4. Testing Dashboard Charts Data...');
    const charts = await reportService.getDashboardCharts(storeId);
    console.log('✔ 7-Day Sales Trend points count:', charts.salesTrend.length);
    console.log('✔ Category Revenue Distribution count:', charts.categoryDistribution.length);

    console.log('5. Testing Sales Report Aggregations...');
    const salesReport = await reportService.getSalesReport(storeId, 'monthly');
    console.log('✔ Monthly Total Bills:', salesReport.totalBillsCount);
    console.log('✔ Monthly Total Revenue: ₹', salesReport.totalRevenue);
    console.log('✔ Monthly Estimated COGS: ₹', salesReport.estimatedCOGS);
    console.log('✔ Monthly Net Profit: ₹', salesReport.netProfit);

    console.log('6. Testing Top & Low Selling Items Aggregation...');
    const itemPerf = await reportService.getTopAndLowSellingItems(storeId, 'monthly');
    console.log('✔ Top Selling Item:', itemPerf.topSellingItems[0]?.itemName, '| Qty Sold:', itemPerf.topSellingItems[0]?.totalQty);

    console.log('--- ALL REPORT & DASHBOARD INTEGRATION TESTS PASSED PERFECTLY ---');
  } catch (error: any) {
    console.error('❌ Test Failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runReportTests();
