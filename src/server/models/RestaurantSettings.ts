import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurantSettings extends Document {
  name: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  openingHours: Record<string, string>;
  isOpen: boolean;
  deliveryCharge: number;
  taxRate: number;
  heroImageUrl: string;
  storyImageUrl: string;
  socialLinks: Record<string, string>;
}

const RestaurantSettingsSchema = new Schema<IRestaurantSettings>(
  {
    name: { type: String, default: 'AL NIHAR' },
    tagline: { type: String, default: 'Premium Burgers, Smashed to Perfection' },
    logoUrl: { type: String, default: '' },
    phone: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'hello@alnihar.com' },
    address: { type: String, default: '123 Food Street, Bandra West, Mumbai 400050' },
    openingHours: {
      type: Map,
      of: String,
      default: {
        monday: '11:00 AM - 11:00 PM',
        tuesday: '11:00 AM - 11:00 PM',
        wednesday: '11:00 AM - 11:00 PM',
        thursday: '11:00 AM - 11:00 PM',
        friday: '11:00 AM - 12:00 AM',
        saturday: '11:00 AM - 12:00 AM',
        sunday: '12:00 PM - 11:00 PM',
      },
    },
    isOpen: { type: Boolean, default: true },
    deliveryCharge: { type: Number, default: 40 },
    taxRate: { type: Number, default: 5 },
    heroImageUrl: { type: String, default: '' },
    storyImageUrl: { type: String, default: '' },
    socialLinks: {
      type: Map,
      of: String,
      default: {
        instagram: 'https://instagram.com',
        facebook: 'https://facebook.com',
        twitter: 'https://twitter.com',
      },
    },
  },
  { timestamps: true },
);

export const RestaurantSettings = mongoose.model<IRestaurantSettings>('RestaurantSettings', RestaurantSettingsSchema);
