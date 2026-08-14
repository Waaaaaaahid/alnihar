import type { CartItem, Coupon, RestaurantSettings } from './types';

export function formatPrice(amount: number): string {
  return `₹${amount.toFixed(0)}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateString);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateOrderTotals(
  items: CartItem[],
  settings: RestaurantSettings | null,
  coupon: Coupon | null,
): {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const taxRate = settings?.taxRate ?? 5;
  const deliveryFee = settings?.deliveryCharge ?? 40;
  const tax = (subtotal * taxRate) / 100;

  let discount = 0;
  if (coupon && coupon.isActive && subtotal >= coupon.minOrder) {
    if (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) {
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      } else {
        discount = coupon.discountValue;
      }
    }
  }

  const total = Math.max(0, subtotal + tax + deliveryFee - discount);
  return { subtotal, tax, deliveryFee, discount, total };
}

export function validatePhone(phone: string): boolean {
  return /^[+]?[\d\s-]{10,15}$/.test(phone.trim());
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
