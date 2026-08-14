import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId | null;
  orderId: mongoose.Types.ObjectId | null;
  name: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    isApproved: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// A customer can review a specific order only once.
ReviewSchema.index({ orderId: 1, userId: 1 }, { unique: true, partialFilterExpression: { orderId: { $type: 'objectId' }, userId: { $type: 'objectId' } } });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);