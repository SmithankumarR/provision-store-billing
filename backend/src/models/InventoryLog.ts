import mongoose, { Schema, Document } from 'mongoose';

export enum InventoryLogType {
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export interface IInventoryLog extends Document {
  storeId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  type: InventoryLogType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryLogSchema: Schema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    type: { type: String, enum: Object.values(InventoryLogType), required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

InventoryLogSchema.index({ storeId: 1, itemId: 1, createdAt: -1 });

export default mongoose.model<IInventoryLog>('InventoryLog', InventoryLogSchema);
