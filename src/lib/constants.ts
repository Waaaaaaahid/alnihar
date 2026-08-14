export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
] as const;

export const CANCELABLE_STATUSES = ['placed', 'confirmed'];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  payment_failed: 'Payment Failed',
};

export const ORDER_STATUS_ICONS: Record<string, string> = {
  placed: 'ReceiptText',
  confirmed: 'CheckCheck',
  preparing: 'Flame',
  ready: 'PackageCheck',
  out_for_delivery: 'Bike',
  delivered: 'Home',
  cancelled: 'XCircle',
  payment_failed: 'CreditCard',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  razorpay: 'Online Payment',
};

export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard' },
  { label: 'Orders', path: '/admin/orders', icon: 'ShoppingBag' },
  { label: 'Menu', path: '/admin/menu', icon: 'UtensilsCrossed' },
  { label: 'Categories', path: '/admin/categories', icon: 'FolderTree' },
  { label: 'Coupons', path: '/admin/coupons', icon: 'TicketPercent' },
  { label: 'Reviews', path: '/admin/reviews', icon: 'Star' },
  { label: 'Payments', path: '/admin/payments', icon: 'CreditCard' },
  { label: 'Users', path: '/admin/users', icon: 'Users' },
  { label: 'Settings', path: '/admin/settings', icon: 'Settings' },
];

export const ESTIMATED_TIMES: Record<string, number> = {
  placed: 45,
  confirmed: 40,
  preparing: 30,
  ready: 15,
  out_for_delivery: 10,
  delivered: 0,
};
