export enum UserRole {
  OWNER = 'OWNER',
  BILLER = 'BILLER',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  storeId: string;
}

export interface Store {
  _id: string;
  name: string;
  address: string;
  phone: string;
  gstNumber?: string;
  footerMessage?: string;
  logoUrl?: string;
  currency: string;
  taxPercentage: number;
  receiptWidth: 58 | 80;
  bluetoothPrinterName?: string;
  defaultDiscount: number;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  storeId: string;
}

export interface Item {
  _id: string;
  name: string;
  categoryId: { _id: string; name: string } | string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  costPrice: number;
  mrp: number;
  discountPercentage: number;
  gstPercentage: number;
  currentStock: number;
  minimumStock: number;
  imageUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  gstNumber?: string;
  address?: string;
  loyaltyPoints: number;
  totalSpent: number;
}

export interface CartItem {
  item: Item;
  quantity: number;
  discountPercentage: number;
  discountAmount: number;
  gstPercentage: number;
  taxAmount: number;
  totalAmount: number;
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  SPLIT = 'SPLIT',
}

export interface Bill {
  _id: string;
  invoiceNumber: string;
  storeId: Store | string;
  cashierId: { _id: string; name: string; role: string } | string;
  customerId?: Customer | string;
  items: Array<{
    itemId: string;
    itemName: string;
    sku: string;
    sellingPrice: number;
    quantity: number;
    discountPercentage: number;
    discountAmount: number;
    gstPercentage: number;
    taxAmount: number;
    totalAmount: number;
  }>;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  splitDetails?: {
    cashAmount?: number;
    cardAmount?: number;
    upiAmount?: number;
  };
  status: 'PAID' | 'CANCELLED' | 'REFUNDED';
  createdAt: string;
}

export interface DashboardSummary {
  todayRevenue: number;
  todayBillsCount: number;
  averageBillValue: number;
  monthlySales: number;
  monthlyProfit: number;
  totalInventoryValue: number;
  lowStockCount: number;
  recentBills: Bill[];
}

export interface AppSettings {
  darkMode: boolean;
  language: 'en' | 'hi' | 'kn';
  autoPrintReceipt: boolean;
  enableSound: boolean;
  lowStockNotification: boolean;
}
