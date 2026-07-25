import mongoose from 'mongoose';
import Bill, { IBill, IBillItem, PaymentMethod, BillStatus } from '../models/Bill';
import Item, { IItem, ItemStatus } from '../models/Item';
import Customer from '../models/Customer';
import Store from '../models/Store';
import InventoryLog, { InventoryLogType } from '../models/InventoryLog';
import { ApiError } from '../middlewares/errorHandler';

export interface CreateBillPayload {
  items: Array<{
    itemId: string;
    quantity: number;
    discountPercentage?: number;
  }>;
  paymentMethod: PaymentMethod;
  splitDetails?: {
    cashAmount?: number;
    cardAmount?: number;
    upiAmount?: number;
  };
  billDiscountType?: 'FLAT' | 'PERCENTAGE';
  billDiscountValue?: number;
  customerId?: string;
  notes?: string;
}

export interface BillQueryFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  cashierId?: string;
  customerId?: string;
  search?: string;
}

export const generateInvoiceNumber = async (storeId: string): Promise<string> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, '');

  const todayBillsCount = await Bill.countDocuments({
    storeId,
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const sequence = String(todayBillsCount + 1).padStart(4, '0');
  return `INV-${dateStr}-${sequence}`;
};

export const createBill = async (
  storeId: string,
  cashierId: string,
  payload: CreateBillPayload
): Promise<IBill> => {
  if (!payload.items || payload.items.length === 0) {
    throw new ApiError('Cart must contain at least one item.', 400);
  }

  const store = await Store.findById(storeId);
  if (!store) {
    throw new ApiError('Store not found.', 404);
  }

  const processedItems: IBillItem[] = [];
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let taxTotal = 0;

  // Process and validate each cart item
  for (const cartItem of payload.items) {
    const item = await Item.findOne({ _id: cartItem.itemId, storeId });
    if (!item) {
      throw new ApiError(`Item with ID '${cartItem.itemId}' not found in store.`, 404);
    }

    if (item.status !== ItemStatus.ACTIVE) {
      throw new ApiError(`Item '${item.name}' is inactive and cannot be billed.`, 400);
    }

    if (item.currentStock < cartItem.quantity) {
      throw new ApiError(
        `Insufficient stock for item '${item.name}'. Current stock: ${item.currentStock}, Requested: ${cartItem.quantity}.`,
        400
      );
    }

    const sellingPrice = item.sellingPrice;
    const discountPercentage =
      cartItem.discountPercentage !== undefined
        ? cartItem.discountPercentage
        : item.discountPercentage || 0;

    const rawPrice = sellingPrice * cartItem.quantity;
    const discountAmount = (rawPrice * discountPercentage) / 100;
    const discountedPrice = rawPrice - discountAmount;

    const gstPercentage = item.gstPercentage || 0;
    const taxAmount = (discountedPrice * gstPercentage) / 100;
    const totalAmount = discountedPrice + taxAmount;

    subtotal += rawPrice;
    itemDiscountTotal += discountAmount;
    taxTotal += taxAmount;

    processedItems.push({
      itemId: item._id as mongoose.Types.ObjectId,
      itemName: item.name,
      sku: item.sku,
      sellingPrice: item.sellingPrice,
      quantity: cartItem.quantity,
      discountPercentage,
      discountAmount,
      gstPercentage,
      taxAmount,
      totalAmount,
    });
  }

  // Calculate bill-level additional discount
  let overallDiscount = 0;
  if (payload.billDiscountType && payload.billDiscountValue) {
    if (payload.billDiscountType === 'FLAT') {
      overallDiscount = payload.billDiscountValue;
    } else if (payload.billDiscountType === 'PERCENTAGE') {
      overallDiscount = ((subtotal - itemDiscountTotal) * payload.billDiscountValue) / 100;
    }
  }

  const totalDiscount = itemDiscountTotal + overallDiscount;
  const rawGrandTotal = subtotal - totalDiscount + taxTotal;

  // Round-off calculation
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  // Payment Method Validation for Split Payment
  if (payload.paymentMethod === PaymentMethod.SPLIT) {
    if (!payload.splitDetails) {
      throw new ApiError('Split payment details are required when payment method is SPLIT.', 400);
    }
    const cash = payload.splitDetails.cashAmount || 0;
    const card = payload.splitDetails.cardAmount || 0;
    const upi = payload.splitDetails.upiAmount || 0;
    const splitTotal = cash + card + upi;

    if (splitTotal < roundedGrandTotal) {
      throw new ApiError(
        `Split payment total (₹${splitTotal}) is less than grand total (₹${roundedGrandTotal}).`,
        400
      );
    }
  }

  const invoiceNumber = await generateInvoiceNumber(storeId);

  const bill = new Bill({
    invoiceNumber,
    storeId,
    cashierId,
    customerId: payload.customerId || undefined,
    items: processedItems,
    subtotal,
    discountTotal: totalDiscount,
    taxTotal,
    roundOff,
    grandTotal: roundedGrandTotal,
    paymentMethod: payload.paymentMethod,
    splitDetails: payload.splitDetails,
    status: BillStatus.PAID,
    notes: payload.notes || '',
  });

  await bill.save();

  // Atomically update inventory stocks and write audit logs
  for (const billItem of processedItems) {
    const item = await Item.findById(billItem.itemId);
    if (item) {
      const previousStock = item.currentStock;
      item.currentStock = Math.max(0, item.currentStock - billItem.quantity);
      await item.save();

      await InventoryLog.create({
        storeId,
        itemId: item._id,
        type: InventoryLogType.STOCK_OUT,
        quantity: billItem.quantity,
        previousStock,
        newStock: item.currentStock,
        reason: `Sales Invoice #${invoiceNumber}`,
        createdBy: cashierId,
      });
    }
  }

  // Update Customer Loyalty & Total Spent if customer attached
  if (payload.customerId) {
    const customer = await Customer.findOne({ _id: payload.customerId, storeId });
    if (customer) {
      customer.totalSpent += roundedGrandTotal;
      // 1 loyalty point for every ₹100 spent
      customer.loyaltyPoints += Math.floor(roundedGrandTotal / 100);
      await customer.save();
    }
  }

  return await Bill.findById(bill._id)
    .populate('storeId')
    .populate('cashierId', 'name role email')
    .populate('customerId', 'name phone loyaltyPoints') as IBill;
};

export const getBills = async (storeId: string, filters: BillQueryFilters) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  const skip = (page - 1) * limit;

  const query: any = { storeId };

  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
  }

  if (filters.cashierId) {
    query.cashierId = filters.cashierId;
  }

  if (filters.customerId) {
    query.customerId = filters.customerId;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.createdAt.$lte = new Date(filters.endDate);
    }
  }

  if (filters.search) {
    query.invoiceNumber = new RegExp(filters.search.trim(), 'i');
  }

  const total = await Bill.countDocuments(query);
  const bills = await Bill.find(query)
    .populate('cashierId', 'name role')
    .populate('customerId', 'name phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    bills,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getTodayBillsSummary = async (storeId: string, cashierId?: string) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const query: any = {
    storeId,
    status: BillStatus.PAID,
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  };

  if (cashierId) {
    query.cashierId = cashierId;
  }

  const todayBills = await Bill.find(query);

  let totalSales = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  const paymentBreakdown = {
    CASH: 0,
    UPI: 0,
    CARD: 0,
    SPLIT: 0,
  };

  todayBills.forEach((bill) => {
    totalSales += bill.grandTotal;
    totalDiscount += bill.discountTotal;
    totalTax += bill.taxTotal;

    if (bill.paymentMethod in paymentBreakdown) {
      paymentBreakdown[bill.paymentMethod as keyof typeof paymentBreakdown] += bill.grandTotal;
    }
  });

  return {
    date: startOfDay.toISOString().slice(0, 10),
    totalBillsCount: todayBills.length,
    totalSales,
    totalDiscount,
    totalTax,
    averageBillValue: todayBills.length > 0 ? Number((totalSales / todayBills.length).toFixed(2)) : 0,
    paymentBreakdown,
  };
};

export const getBillById = async (storeId: string, billId: string): Promise<IBill> => {
  const bill = await Bill.findOne({ _id: billId, storeId })
    .populate('storeId')
    .populate('cashierId', 'name role email')
    .populate('customerId', 'name phone address gstNumber loyaltyPoints');

  if (!bill) {
    throw new ApiError('Bill invoice not found.', 404);
  }
  return bill;
};

export const cancelBill = async (
  storeId: string,
  billId: string,
  userId: string
): Promise<IBill> => {
  const bill = await Bill.findOne({ _id: billId, storeId });
  if (!bill) {
    throw new ApiError('Bill invoice not found.', 404);
  }

  if (bill.status === BillStatus.CANCELLED) {
    throw new ApiError('This bill invoice has already been cancelled.', 400);
  }

  bill.status = BillStatus.CANCELLED;
  await bill.save();

  // Restore inventory stocks & create audit logs
  for (const billItem of bill.items) {
    const item = await Item.findById(billItem.itemId);
    if (item) {
      const previousStock = item.currentStock;
      item.currentStock += billItem.quantity;
      await item.save();

      await InventoryLog.create({
        storeId,
        itemId: item._id,
        type: InventoryLogType.STOCK_IN,
        quantity: billItem.quantity,
        previousStock,
        newStock: item.currentStock,
        reason: `Bill Cancellation #${bill.invoiceNumber}`,
        createdBy: userId,
      });
    }
  }

  // Reverse Customer Loyalty Points and Total Spent if applicable
  if (bill.customerId) {
    const customer = await Customer.findOne({ _id: bill.customerId, storeId });
    if (customer) {
      customer.totalSpent = Math.max(0, customer.totalSpent - bill.grandTotal);
      customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - Math.floor(bill.grandTotal / 100));
      await customer.save();
    }
  }

  return bill;
};
