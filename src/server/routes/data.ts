import { Router } from 'express';
import { Coupon } from '../models/Coupon';
import { Review } from '../models/Review';
import { Payment } from '../models/Payment';
import { RestaurantSettings } from '../models/RestaurantSettings';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { success, error } from '../utils/helpers';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ============ COUPONS ============
router.get('/coupons', async (_req, res: any) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return success(res, coupons);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.get('/coupons/:code', async (req, res: any) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });
    if (!coupon) return error(res, 'Coupon not found', 404);
    return success(res, coupon);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.post('/coupons', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase(), usedCount: 0 });
    return success(res, coupon, 'Coupon created', 201);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.put('/coupons/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const updates = { ...req.body };
    if (updates.code) updates.code = updates.code.toUpperCase();
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!coupon) return error(res, 'Coupon not found', 404);
    return success(res, coupon, 'Coupon updated');
  } catch (e: any) { return error(res, e.message, 500); }
});

router.delete('/coupons/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    return success(res, null, 'Coupon deleted');
  } catch (e: any) { return error(res, e.message, 500); }
});

// ============ REVIEWS ============
// Public: only approved AND visible reviews
router.get('/reviews', async (_req, res: any) => {
  try {
    const reviews = await Review.find({ isApproved: true, isVisible: true }).sort({ createdAt: -1 });
    return success(res, reviews);
  } catch (e: any) { return error(res, e.message, 500); }
});

// Admin: all reviews with order info
router.get('/reviews/admin', authMiddleware, adminMiddleware, async (_req, res: any) => {
  try {
    const reviews = await Review.find().populate('orderId', 'orderNumber customerName').sort({ createdAt: -1 });
    const mapped = reviews.map((r) => {
      const doc = r.toObject();
      const orderId = doc.orderId as unknown as { _id?: unknown; orderNumber?: string; customerName?: string } | null;
      if (orderId && typeof orderId === 'object' && orderId._id) {
        return {
          ...doc,
          order: { _id: orderId._id, orderNumber: orderId.orderNumber, customerName: orderId.customerName },
          orderId: String(orderId._id),
        };
      }
      return doc;
    });
    return success(res, mapped);
  } catch (e: any) { return error(res, e.message, 500); }
});

// Customer: check if they already reviewed a specific order
router.get('/reviews/order/:orderId', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const review = await Review.findOne({ orderId: req.params.orderId, userId: req.userId });
    return success(res, review);
  } catch (e: any) { return error(res, e.message, 500); }
});

// Customer submits a review for a delivered order (or admin creates one manually)
router.post('/reviews', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { orderId, name, rating, comment } = req.body;
    const numRating = Math.min(5, Math.max(1, parseInt(rating) || 1));

    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) return error(res, 'Order not found', 404);
      if (String(order.userId) !== String(req.userId)) return error(res, 'You can only review your own orders', 403);
      if (order.status !== 'delivered') return error(res, 'You can review an order only after it is delivered', 400);
      const existing = await Review.findOne({ orderId, userId: req.userId });
      if (existing) return error(res, 'You have already reviewed this order', 400);
    } else if (req.userRole !== 'admin') {
      return error(res, 'Order reference is required', 400);
    }

    const user = await User.findById(req.userId).select('name');
    const review = await Review.create({
      userId: req.userId || null,
      orderId: orderId || null,
      name: name || user?.name || 'Customer',
      rating: numRating,
      comment: comment || '',
      isApproved: req.userRole === 'admin',
      isVisible: true,
    });
    return success(res, review, 'Review submitted', 201);
  } catch (e: any) {
    if (e?.code === 11000) return error(res, 'You have already reviewed this order', 400);
    return error(res, e.message, 500);
  }
});

// Admin: edit review (rating/comment), approve/reject, show/hide
router.put('/reviews/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { rating, comment, isApproved, isVisible, name } = req.body;
    const updates: any = {};
    if (rating !== undefined) updates.rating = Math.min(5, Math.max(1, parseInt(rating) || 1));
    if (comment !== undefined) updates.comment = comment;
    if (name !== undefined) updates.name = name;
    if (isApproved !== undefined) updates.isApproved = !!isApproved;
    if (isVisible !== undefined) updates.isVisible = !!isVisible;
    const review = await Review.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!review) return error(res, 'Review not found', 404);
    return success(res, review, 'Review updated');
  } catch (e: any) { return error(res, e.message, 500); }
});

router.delete('/reviews/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    return success(res, null, 'Review deleted');
  } catch (e: any) { return error(res, e.message, 500); }
});

// ============ PAYMENTS ============
router.get('/payments', authMiddleware, adminMiddleware, async (_req, res: any) => {
  try {
    const payments = await Payment.find().populate('orderId', 'orderNumber customerName total').sort({ createdAt: -1 });
    return success(res, payments);
  } catch (e: any) { return error(res, e.message, 500); }
});

// ============ USERS (admin) ============
router.get('/users', authMiddleware, adminMiddleware, async (_req, res: any) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return success(res, users);
  } catch (e: any) { return error(res, e.message, 500); }
});

// ============ RESTAURANT SETTINGS ============
router.get('/settings', async (_req, res: any) => {
  try {
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create({});
    }
    return success(res, settings);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.put('/settings', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create(req.body);
    } else {
      settings = await RestaurantSettings.findOneAndUpdate({}, req.body, { new: true });
    }
    return success(res, settings, 'Settings updated');
  } catch (e: any) { return error(res, e.message, 500); }
});

export default router;
