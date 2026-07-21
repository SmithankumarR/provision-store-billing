import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  gstNumber?: string;
  address?: string;
  loyaltyPoints: number;
  totalSpent: number;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    gstNumber: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Unique customer phone per store
CustomerSchema.index({ storeId: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ storeId: 1, name: 1 });

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
