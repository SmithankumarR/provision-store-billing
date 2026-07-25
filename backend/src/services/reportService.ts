import mongoose from 'mongoose';
import Bill, { BillStatus } from '../models/Bill';
import Item, { ItemStatus } from '../models/Item';
import Category from '../models/Category';

export const getDateRange = (
  period: 'today' | 'yesterday' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  startDateStr?: string,
  endDateStr?: string
): { startDate: Date; endDate: Date } => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (period === 'today') {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'yesterday') {
    startDate.setDate(now.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(now.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'weekly') {
    startDate.setDate(now.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === 'yearly') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (period === 'custom' && startDateStr && endDateStr) {
    startDate = new Date(startDateStr);
    endDate = new Date(endDateStr);
  } else {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

export const getDashboardSummary = async (storeId: string) => {
  const todayRange = getDateRange('today');
  const monthRange = getDateRange('monthly');

  // 1. Today's Sales
  const todayBills = await Bill.find({
    storeId,
    status: BillStatus.PAID,
    createdAt: { $gte: todayRange.startDate, $lte: todayRange.endDate },
  });

  const todayRevenue = todayBills.reduce((acc, bill) => acc + bill.grandTotal, 0);
  const todayBillsCount = todayBills.length;
  const averageBillValue = todayBillsCount > 0 ? Number((todayRevenue / todayBillsCount).toFixed(2)) : 0;

  // 2. Monthly Sales
  const monthlyBills = await Bill.find({
    storeId,
    status: BillStatus.PAID,
    createdAt: { $gte: monthRange.startDate, $lte: monthRange.endDate },
  });

  const monthlySales = monthlyBills.reduce((acc, bill) => acc + bill.grandTotal, 0);

  // 3. Monthly Profit Estimation (Revenue - Cost of Goods Sold)
  let monthlyCOGS = 0;
  for (const bill of monthlyBills) {
    for (const item of bill.items) {
      const dbItem = await Item.findById(item.itemId);
      const costPrice = dbItem ? dbItem.costPrice : item.sellingPrice * 0.7; // Fallback 30% margin
      monthlyCOGS += costPrice * item.quantity;
    }
  }
  const monthlyProfit = Math.max(0, monthlySales - monthlyCOGS);

  // 4. Store Inventory Valuation (Sum of currentStock * costPrice)
  const storeItems = await Item.find({ storeId, status: ItemStatus.ACTIVE });
  const totalInventoryValue = storeItems.reduce((acc, item) => acc + item.currentStock * item.costPrice, 0);

  // 5. Low Stock Count
  const lowStockCount = storeItems.filter((item) => item.currentStock <= item.minimumStock).length;

  // 6. Recent 5 Bills
  const recentBills = await Bill.find({ storeId })
    .populate('cashierId', 'name')
    .populate('customerId', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    todayRevenue,
    todayBillsCount,
    averageBillValue,
    monthlySales,
    monthlyProfit: Number(monthlyProfit.toFixed(2)),
    totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
    lowStockCount,
    recentBills,
  };
};

export const getDashboardCharts = async (storeId: string) => {
  const last7Days: Array<{ date: string; sales: number; count: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

    const bills = await Bill.find({
      storeId,
      status: BillStatus.PAID,
      createdAt: { $gte: start, $lte: end },
    });

    const revenue = bills.reduce((acc, b) => acc + b.grandTotal, 0);
    const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' });

    last7Days.push({
      date: dayLabel,
      sales: revenue,
      count: bills.length,
    });
  }

  // Category Revenue Distribution
  const categoryAgg = await Bill.aggregate([
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(storeId),
        status: BillStatus.PAID,
      },
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'items',
        localField: 'items.itemId',
        foreignField: '_id',
        as: 'itemDetails',
      },
    },
    { $unwind: '$itemDetails' },
    {
      $lookup: {
        from: 'categories',
        localField: 'itemDetails.categoryId',
        foreignField: '_id',
        as: 'categoryDetails',
      },
    },
    { $unwind: '$categoryDetails' },
    {
      $group: {
        _id: '$categoryDetails.name',
        totalRevenue: { $sum: '$items.totalAmount' },
        totalQuantity: { $sum: '$items.quantity' },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  // Payment Breakdown
  const paymentAgg = await Bill.aggregate([
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(storeId),
        status: BillStatus.PAID,
      },
    },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$grandTotal' },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    salesTrend: last7Days,
    categoryDistribution: categoryAgg,
    paymentBreakdown: paymentAgg,
  };
};

export const getSalesReport = async (
  storeId: string,
  period: 'today' | 'yesterday' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  startDateStr?: string,
  endDateStr?: string
) => {
  const { startDate, endDate } = getDateRange(period, startDateStr, endDateStr);

  const bills = await Bill.find({
    storeId,
    status: BillStatus.PAID,
    createdAt: { $gte: startDate, $lte: endDate },
  });

  let totalRevenue = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let estimatedCOGS = 0;
  const paymentBreakdown = { CASH: 0, UPI: 0, CARD: 0, SPLIT: 0 };

  for (const bill of bills) {
    totalRevenue += bill.grandTotal;
    totalDiscount += bill.discountTotal;
    totalTax += bill.taxTotal;

    if (bill.paymentMethod in paymentBreakdown) {
      paymentBreakdown[bill.paymentMethod as keyof typeof paymentBreakdown] += bill.grandTotal;
    }

    for (const item of bill.items) {
      const dbItem = await Item.findById(item.itemId);
      const cost = dbItem ? dbItem.costPrice : item.sellingPrice * 0.7;
      estimatedCOGS += cost * item.quantity;
    }
  }

  const netProfit = Math.max(0, totalRevenue - estimatedCOGS - totalTax);

  return {
    period,
    startDate,
    endDate,
    totalBillsCount: bills.length,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    estimatedCOGS: Number(estimatedCOGS.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    paymentBreakdown,
  };
};

export const getTopAndLowSellingItems = async (
  storeId: string,
  period: 'today' | 'yesterday' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
) => {
  const { startDate, endDate } = getDateRange(period);

  const agg = await Bill.aggregate([
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(storeId),
        status: BillStatus.PAID,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.itemId',
        itemName: { $first: '$items.itemName' },
        sku: { $first: '$items.sku' },
        totalQty: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalAmount' },
      },
    },
  ]);

  const topSelling = [...agg].sort((a, b) => b.totalQty - a.totalQty).slice(0, 10);
  const lowSelling = [...agg].sort((a, b) => a.totalQty - b.totalQty).slice(0, 10);

  return {
    period,
    topSellingItems: topSelling,
    lowSellingItems: lowSelling,
  };
};
