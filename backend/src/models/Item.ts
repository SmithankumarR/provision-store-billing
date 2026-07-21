import mongoose, { Schema, Document } from 'mongoose';

export enum ItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface IItem extends Document {
  name: string;
  categoryId: mongoose.Types.ObjectId;
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
  status: ItemStatus;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    barcode: { type: String, trim: true, default: '' },
    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    gstPercentage: { type: Number, default: 0, min: 0, max: 100 },
    currentStock: { type: Number, required: true, default: 0 },
    minimumStock: { type: Number, required: true, default: 5 },
    imageUrl: { type: String, default: '' },
    status: { type: String, enum: Object.values(ItemStatus), default: ItemStatus.ACTIVE, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
ItemSchema.index({ storeId: 1, sku: 1 }, { unique: true });
ItemSchema.index({ storeId: 1, barcode: 1 });
ItemSchema.index({ storeId: 1, name: 1 });

export default mongoose.model<IItem>('Item', ItemSchema);
