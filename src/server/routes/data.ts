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
router.get('/coupons', async (_req, res: any) => { try { return success(res, await Coupon.find().sort({ createdAt: -1 })); } catch (e: any) { return error(res, e.message, 500); } });
router.get('/coupons/:code', async (req, res: any) => { try { const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() }); if (!coupon) return error(res, 'Coupon not found', 404); return success(res, coupon); } catch (e: any) { return error(res, e.message, 500); } });
router.post('/coupons', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => { try { const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase(), usedCount: 0 }); return success(res, coupon, 'Coupon created', 201); } catch (e: any) { return error(res, e.message, 500); } });
router.put('/coupons/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => { try { const updates = { ...req.body }; if (updates.code) updates.code = updates.code.toUpperCase(); const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true }); if (!coupon) return error(res, 'Coupon not found', 404); return success(res, coupon, 'Coupon updated'); } catch (e: any) { return error(res, e.message, 500); } });
router.delete('/coupons/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => { try { await Coupon.findByIdAndDelete(req.params.id); return success(res, null, 'Coupon deleted'); } catch (e: any) { return error(res, e.message, 500); } });

router.get('/reviews', async (_req, res: any) => { try { return success(res, await Review.find({ isApproved: true, isVisible: true }).sort({ createdAt: -1 })); } catch (e: any) { return error(res, e.message, 500); } });
router.get('/reviews/admin', authMiddleware, adminMiddleware, async (_req, res: any) => { try { const reviews = await Review.find().populate('orderId', 'orderNumber customerName').sort({ createdAt: -1 }); const mapped = reviews.map((r) => { const doc = r.toObject(); const orderId = doc.orderId as any; if (orderId && typeof orderId === 'object' && orderId._id) return { ...doc, order: { _id: orderId._id, orderNumber: orderId.orderNumber, customerName: orderId.customerName }, orderId: String(orderId._id) }; return doc; }); return success(res, mapped); } catch (e: any) { return error(res, e.message, 500); } });
router.get('/reviews/order/:orderId', authMiddleware, async (req: AuthRequest, res: any) => { try { return success(res, await Review.findOne({ orderId: req.params.orderId, userId: req.userId })); } catch (e: any) { return error(res, e.message, 500); } });
router.post('/reviews', authMiddleware, async (req: AuthRequest, res: any) => { try { const { orderId, name, rating, comment } = req.body; const numRating = Math.min(5, Math.max(1, parseInt(rating) || 1)); if (orderId) { const order = await Order.findById(orderId); if (!order) return error(res, 'Order not found', 404); if (String(order.userId) !== String(req.userId)) return error(res, 'You can only review your own orders', 403); if (order.status !== 'delivered') return error(res, 'You can review an order only after it is delivered', 400); const existing = await Review.findOne({ orderId, userId: req.userId }); if (existing) return error(res, 'You have already reviewed this order', 400); } else if (req.userRole !== 'admin') return error(res, 'Order reference is required', 400); const user = await User.findById(req.userId).select('name'); const review = await Review.create({ userId: req.userId || null, orderId: orderId || null, name: name || user?.name || 'Customer', rating: numRating, comment: comment || '', isApproved: req.userRole === 'admin', isVisible: true }); return success(res, review, 'Review submitted', 201); } catch (e: any) { if (e?.code === 11000) return error(res, 'You have already reviewed this order', 400); return error(res, e.message, 500); } });
router.put('/reviews/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => { try { const { rating, comment, isApproved, isVisible, name } = req.body; const updates: any = {}; if (rating !== undefined) updates.rating = Math.min(5, Math.max(1, parseInt(rating) || 1)); if (comment !== undefined) updates.comment = comment; if (name !== undefined) updates.name = name; if (isApproved !== undefined) updates.isApproved = !!isApproved; if (isVisible !== undefined) updates.isVisible = !!isVisible; const review = await Review.findByIdAndUpdate(req.params.id, updates, { new: true }); if (!review) return error(res, 'Review not found', 404); return success(res, review, 'Review updated'); } catch (e: any) { return error(res, e.message, 500); } });
router.delete('/reviews/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => { try { await Review.findByIdAndDelete(req.params.id); return success(res, null, 'Review deleted'); } catch (e: any) { return error(res, e.message, 500); } });

router.get('/payments', authMiddleware, adminMiddleware, async (_req, res: any) => { try { const payments = await Payment.find({ status: 'paid' }).populate('orderId').sort({ createdAt: -1 }); const mapped = payments.map((payment) => { const doc = payment.toObject() as any; const order = doc.orderId && typeof doc.orderId === 'object' ? doc.orderId : null; return { ...doc, orderId: order?._id || doc.orderId, order: order ? { _id: order._id, orderNumber: order.orderNumber, customerName: order.customerName, customerPhone: order.customerPhone, customerEmail: order.customerEmail, deliveryAddress: order.deliveryAddress, deliveryLatitude: order.deliveryLatitude, deliveryLongitude: order.deliveryLongitude, orderNotes: order.orderNotes, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, items: order.items, subtotal: order.subtotal, tax: order.tax, deliveryFee: order.deliveryFee, discount: order.discount, total: order.total, createdAt: order.createdAt, updatedAt: order.updatedAt } : null }; }); return success(res, mapped); } catch (e: any) { return error(res, e.message, 500); } });

router.get('/users', authMiddleware, adminMiddleware, async (_req, res: any) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    const customerIds = users.filter((u:any) => u.role === 'customer').map((u:any) => u._id);
    const paymentStats = await Payment.aggregate([
      { $match: { status: 'paid', userId: { $in: customerIds } } },
      { $group: { _id: '$userId', onlineOrders: { $sum: 1 }, onlineSpend: { $sum: '$amount' } } },
    ]);
    const stats = new Map(paymentStats.map((s:any) => [String(s._id), { onlineOrders: s.onlineOrders, onlineSpend: s.onlineSpend }]));
    return success(res, users.map((u:any) => ({ ...u, id: u._id, codEnabled: u.codEnabled === true, onlineOrders: stats.get(String(u._id))?.onlineOrders || 0, onlineSpend: stats.get(String(u._id))?.onlineSpend || 0 })));
  } catch (e: any) { return error(res, e.message, 500); }
});

router.put('/users/:id/cod', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    if (typeof req.body.enabled !== 'boolean') return error(res, 'enabled must be true or false', 400);
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'customer' }, { codEnabled: req.body.enabled }, { new: true }).select('-password');
    if (!user) return error(res, 'Customer not found', 404);
    return success(res, { id: user._id, codEnabled: user.codEnabled === true }, `COD ${user.codEnabled ? 'enabled' : 'locked'} for customer`);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.get('/settings', async (_req, res: any) => { try { let settings = await RestaurantSettings.findOne(); if (!settings) settings = await RestaurantSettings.create({}); return success(res, settings); } catch (e: any) { return error(res, e.message, 500); } });
router.put('/settings', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => { try { let settings = await RestaurantSettings.findOne(); if (!settings) settings = await RestaurantSettings.create(req.body); else settings = await RestaurantSettings.findOneAndUpdate({}, req.body, { new: true }); return success(res, settings, 'Settings updated'); } catch (e: any) { return error(res, e.message, 500); } });
export default router;
