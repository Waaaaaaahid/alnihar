import { Router } from 'express';
import { Coupon } from '../models/Coupon';
import { Review } from '../models/Review';
import { Payment } from '../models/Payment';
import { RestaurantSettings } from '../models/RestaurantSettings';
import { User } from '../models/User';
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
router.get('/reviews', async (req, res: any) => {
  try {
    const approvedOnly = req.query.approved !== 'false';
    const filter = approvedOnly ? { isApproved: true } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    return success(res, reviews);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.post('/reviews', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { name, rating, comment } = req.body;
    if (!name || !rating) return error(res, 'Name and rating are required', 400);
    const review = await Review.create({ userId: req.userId || null, name, rating, comment: comment || '', isApproved: false });
    return success(res, review, 'Review submitted', 201);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.put('/reviews/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
