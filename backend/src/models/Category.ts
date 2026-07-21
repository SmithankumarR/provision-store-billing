import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so category names are unique per store
CategorySchema.index({ storeId: 1, name: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', CategorySchema);
