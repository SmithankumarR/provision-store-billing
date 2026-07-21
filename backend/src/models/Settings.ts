import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  storeId: mongoose.Types.ObjectId;
  darkMode: boolean;
  language: 'en' | 'hi' | 'kn';
  autoPrintReceipt: boolean;
  enableSound: boolean;
  lowStockNotification: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, unique: true, index: true },
    darkMode: { type: Boolean, default: false },
    language: { type: String, enum: ['en', 'hi', 'kn'], default: 'en' },
    autoPrintReceipt: { type: Boolean, default: true },
    enableSound: { type: Boolean, default: true },
    lowStockNotification: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISettings>('Settings', SettingsSchema);
