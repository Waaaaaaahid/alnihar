import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | null;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  },
  { timestamps: true },
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
