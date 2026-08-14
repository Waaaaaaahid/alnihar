import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export type OrderStatus =
  | 'placed' | 'confirmed' | 'preparing' | 'ready'
  | 'out_for_delivery' | 'delivered' | 'cancelled' | 'payment_failed';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  orderNotes: string;
  status: OrderStatus;
  paymentMethod: 'cod' | 'razorpay';
  paymentStatus: PaymentStatus;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode: string;
  estimatedMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', default: null },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  imageUrl: { type: String, default: '' },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    deliveryAddress: { type: String, required: true },
    orderNotes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'payment_failed'],
      default: 'placed',
    },
    paymentMethod: { type: String, enum: ['cod', 'razorpay'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    items: [OrderItemSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    estimatedMinutes: { type: Number, default: 45 },
  },
  { timestamps: true },
);

OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
