import mongoose, { Schema, Document } from 'mongoose';

export type TableBookingStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';

export interface ITableBooking extends Document {
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  time: string;
  guests: number;
  tableNumber: string;
  notes: string;
  status: TableBookingStatus;
  userId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TableBookingSchema = new Schema<ITableBooking>({
  bookingNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true, trim: true, maxlength: 100 },
  customerPhone: { type: String, required: true, trim: true, maxlength: 20 },
  customerEmail: { type: String, default: '', trim: true, maxlength: 254 },
  date: { type: String, required: true },
  time: { type: String, required: true },
  guests: { type: Number, required: true, min: 1, max: 20 },
  tableNumber: { type: String, default: '', trim: true, maxlength: 30 },
  notes: { type: String, default: '', trim: true, maxlength: 500 },
  status: { type: String, enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled'], default: 'pending' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

TableBookingSchema.index({ date: 1, time: 1, status: 1 });
TableBookingSchema.index({ createdAt: -1 });

export const TableBooking = mongoose.model<ITableBooking>('TableBooking', TableBookingSchema);
