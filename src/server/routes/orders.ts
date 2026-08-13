import { Router } from 'express';
import { Order } from '../models/Order';
import { MenuItem } from '../models/MenuItem';
import { Coupon } from '../models/Coupon';
import { RestaurantSettings } from '../models/RestaurantSettings';
import { User } from '../models/User';
import { success, error, generateOrderNumber } from '../utils/helpers';
import { authMiddleware, adminMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Create order
router.post('/', async (req: AuthRequest, res: any) => {
  try {
    const { items, customerName, customerPhone, customerEmail, deliveryAddress, orderNotes, paymentMethod, couponCode, userId } = req.body;

    if (!items || !items.length) return error(res, 'No items in order', 400);
    if (!customerName || !customerPhone || !deliveryAddress) return error(res, 'Name, phone, and address are required', 400);

    const settings = await RestaurantSettings.findOne();
    if (!settings) return error(res, 'Restaurant settings not configured', 500);

    // Validate items and get current prices from DB
    const orderItems = [];
    let subtotal = 0;
    for (const cartItem of items) {
      const menuItem = await MenuItem.findById(cartItem.menuItemId || cartItem.menuItem?.id);
      if (!menuItem) return error(res, `Item not found: ${cartItem.name || cartItem.menuItem?.name}`, 400);
      if (!menuItem.isAvailable) return error(res, `${menuItem.name} is not available`, 400);
      const qty = Math.max(1, parseInt(cartItem.quantity) || 1);
      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
        imageUrl: menuItem.imageUrl,
      });
      subtotal += menuItem.price * qty;
    }

    // Calculate tax and delivery fee
    const tax = (subtotal * (settings.taxRate || 5)) / 100;
    const deliveryFee = settings.deliveryCharge || 40;

    // Validate coupon
    let discount = 0;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (!couponDoc) return error(res, 'Invalid coupon code', 400);
      if (!couponDoc.isActive) return error(res, 'Coupon is not active', 400);
      if (couponDoc.expiresAt && new Date(couponDoc.expiresAt) < new Date()) return error(res, 'Coupon has expired', 400);
      if (subtotal < couponDoc.minOrder) return error(res, `Minimum order ₹${couponDoc.minOrder} required for this coupon`, 400);
      if (couponDoc.usageLimit && couponDoc.usedCount >= couponDoc.usageLimit) return error(res, 'Coupon usage limit reached', 400);

      if (couponDoc.discountType === 'percentage') {
        discount = (subtotal * couponDoc.discountValue) / 100;
        if (couponDoc.maxDiscount) discount = Math.min(discount, couponDoc.maxDiscount);
      } else {
        discount = couponDoc.discountValue;
      }
    }

    const total = Math.max(0, subtotal + tax + deliveryFee - discount);

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: userId || (req.userId || null),
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      deliveryAddress,
      orderNotes: orderNotes || '',
      status: 'placed',
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      items: orderItems,
      subtotal,
      tax,
      deliveryFee,
      discount,
      total,
      couponCode: couponCode || '',
      estimatedMinutes: 45,
    });

    // Increment coupon usage
    if (couponDoc) {
      await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { usedCount: 1 } });
    }

    const populated = await Order.findById(order._id);
    return success(res, populated, 'Order placed successfully', 201);
  } catch (e: any) {
    return error(res, e.message || 'Failed to create order', 500);
  }
});

// Get single order
router.get('/:id', async (req, res: any) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return error(res, 'Order not found', 404);
    return success(res, order);
  } catch (e: any) { return error(res, e.message, 500); }
});

// Get order by number
router.get('/number/:orderNumber', async (req, res: any) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() });
    if (!order) return error(res, 'Order not found', 404);
    return success(res, order);
  } catch (e: any) { return error(res, e.message, 500); }
});

// Get user's orders
router.get('/user/:userId', async (req, res: any) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    return success(res, orders);
  } catch (e: any) { return error(res, e.message, 500); }
});

// Get all orders (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res: any) => {
  try {
    const limit = parseInt(req.query.limit as string) || 200;
    const orders = await Order.find().sort({ createdAt: -1 }).limit(limit);
    return success(res, orders);
  } catch (e: any) { return error(res, e.message, 500); }
});

// Update order status (admin)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { status } = req.body;
    const validStatuses = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'payment_failed'];
    if (!validStatuses.includes(status)) return error(res, 'Invalid status', 400);
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return error(res, 'Order not found', 404);
    return success(res, order, 'Status updated');
  } catch (e: any) { return error(res, e.message, 500); }
});

// Update payment status (admin)
router.put('/:id/payment', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { paymentStatus } = req.body;
    const valid = ['pending', 'paid', 'failed', 'refunded'];
    if (!valid.includes(paymentStatus)) return error(res, 'Invalid payment status', 400);
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true });
    if (!order) return error(res, 'Order not found', 404);
    return success(res, order, 'Payment status updated');
  } catch (e: any) { return error(res, e.message, 500); }
});

// Admin stats
router.get('/stats/overview', authMiddleware, adminMiddleware, async (_req, res: any) => {
  try {
    const totalOrders = await Order.countDocuments();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const pendingOrders = await Order.countDocuments({ status: { $in: ['placed', 'confirmed'] } });
    const preparingOrders = await Order.countDocuments({ status: 'preparing' });
    const completedOrders = await Order.countDocuments({ status: 'delivered' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalMenuItems = await MenuItem.countDocuments();
    const availableItems = await MenuItem.countDocuments({ isAvailable: true });
    const paidOrders = await Order.find({ paymentStatus: 'paid' });
    const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    return success(res, { totalOrders, todayOrders, pendingOrders, preparingOrders, completedOrders, totalCustomers, totalMenuItems, availableItems, revenue });
  } catch (e: any) { return error(res, e.message, 500); }
});

router.get('/stats/sales', authMiddleware, adminMiddleware, async (req, res: any) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const orders = await Order.find({ createdAt: { $gte: startDate } }).sort({ createdAt: 1 });

    const byDate: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      byDate[d.toISOString().slice(0, 10)] = { revenue: 0, orders: 0 };
    }
    orders.forEach((o) => {
      const key = o.createdAt.toISOString().slice(0, 10);
      if (byDate[key]) {
        byDate[key].orders += 1;
        if (o.paymentStatus === 'paid') byDate[key].revenue += o.total;
      }
    });
    return success(res, Object.entries(byDate).map(([date, v]) => ({ date, ...v })));
  } catch (e: any) { return error(res, e.message, 500); }
});

export default router;
