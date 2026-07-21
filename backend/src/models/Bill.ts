import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  SPLIT = 'SPLIT',
}

export enum BillStatus {
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface IBillItem {
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  sku: string;
  sellingPrice: number;
  quantity: number;
  discountPercentage: number;
  discountAmount: number;
  gstPercentage: number;
  taxAmount: number;
  totalAmount: number;
}

export interface ISplitDetails {
  cashAmount?: number;
  cardAmount?: number;
  upiAmount?: number;
}

export interface IBill extends Document {
  invoiceNumber: string;
  storeId: mongoose.Types.ObjectId;
  cashierId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  items: IBillItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  splitDetails?: ISplitDetails;
  status: BillStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillItemSchema: Schema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    itemName: { type: String, required: true },
    sku: { type: String, required: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    gstPercentage: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const BillSchema: Schema = new Schema(
  {
    invoiceNumber: { type: String, required: true, uppercase: true, trim: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    items: [BillItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, required: true, default: 0, min: 0 },
    taxTotal: { type: Number, required: true, default: 0, min: 0 },
    roundOff: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    splitDetails: {
      cashAmount: { type: Number, default: 0 },
      cardAmount: { type: Number, default: 0 },
      upiAmount: { type: Number, default: 0 },
    },
    status: { type: String, enum: Object.values(BillStatus), default: BillStatus.PAID },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Indexes for quick lookup & sales report aggregation
BillSchema.index({ storeId: 1, invoiceNumber: 1 }, { unique: true });
BillSchema.index({ storeId: 1, createdAt: -1 });
BillSchema.index({ storeId: 1, status: 1 });

export default mongoose.model<IBill>('Bill', BillSchema);
