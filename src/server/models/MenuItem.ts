import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  categoryId: mongoose.Types.ObjectId | null;
  imageUrl: string;
  isAvailable: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  isSpicy: boolean;
  sortOrder: number;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    imageUrl: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    isBestseller: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isSpicy: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

MenuItemSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

MenuItemSchema.set('toJSON', { virtuals: true });
MenuItemSchema.set('toObject', { virtuals: true });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
