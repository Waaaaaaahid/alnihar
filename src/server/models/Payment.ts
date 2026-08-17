import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId | null;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  checkoutData?: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    deliveryAddress: string;
    deliveryLatitude?: number | null;
    deliveryLongitude?: number | null;
    orderNotes: string;
    userId: string | null;
    items: Array<{ menuItemId: string; name: string; quantity: number; imageUrl: string }>;
    couponCode: string;
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    total: number;
  };
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    checkoutData: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
