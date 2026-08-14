import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId | null;
  name: string;
  rating: number;
  comment: string;
  isApproved: boolean;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
