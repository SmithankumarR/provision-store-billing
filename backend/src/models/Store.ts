import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    gstNumber: { type: String, trim: true, default: '' },
    footerMessage: { type: String, default: 'Thank you for shopping with us! Visit again.' },
    logoUrl: { type: String, default: '' },
    currency: { type: String, default: '₹' },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
    receiptWidth: { type: Number, enum: [58, 80], default: 58 },
    bluetoothPrinterName: { type: String, default: '' },
    defaultDiscount: { type: Number, default: 0, min: 0, max: 100 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IStore>('Store', StoreSchema);
