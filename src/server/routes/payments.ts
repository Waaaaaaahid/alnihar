import { Router } from 'express';
import crypto from 'node:crypto';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { RestaurantSettings } from '../models/RestaurantSettings';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { error, success } from '../utils/helpers';

const router = Router();

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the backend environment.');
  return { keyId, keySecret };
}

async function razorpayRequest(path: string, method: string, body?: unknown) {
  const { keyId, keySecret } = getRazorpayCredentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.description || `Razorpay request failed (${response.status})`);
  return data;
}

router.post('/razorpay/order', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return error(res, 'Order ID is required', 400);

    const order = await Order.findById(orderId);
    if (!order) return error(res, 'Order not found', 404);
    if (order.userId && order.userId.toString() !== req.userId) return error(res, 'You cannot pay for this order', 403);
    if (order.paymentMethod !== 'razorpay') return error(res, 'This order is not an online payment order', 400);
    if (order.paymentStatus === 'paid') return error(res, 'Order is already paid', 400);
    if (order.status === 'cancelled') return error(res, 'Cancelled orders cannot be paid', 400);

    const settings = await RestaurantSettings.findOne();
    if (!settings?.isOpen) return error(res, "We're closed right now. Please check back soon.", 403);

    const amountPaise = Math.round(Number(order.total) * 100);
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) return error(res, 'Invalid order amount', 400);

    const receipt = `alnihar_${order.orderNumber}`.slice(0, 40);
    const razorpayOrder = await razorpayRequest('/orders', 'POST', {
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { alNiharOrderId: order._id.toString(), orderNumber: order.orderNumber },
    });

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { orderId: order._id, userId: order.userId || null, razorpayOrderId: razorpayOrder.id, amount: Number(order.total), status: 'pending' },
      { upsert: true, new: true },
    );

    return success(res, { razorpayOrderId: razorpayOrder.id, amount: amountPaise, currency: 'INR', keyId: getRazorpayCredentials().keyId, orderId: order._id.toString(), orderNumber: order.orderNumber });
  } catch (e: any) {
    return error(res, e.message || 'Failed to create Razorpay order', 500);
  }
});

router.post('/razorpay/verify', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return error(res, 'Incomplete Razorpay payment response', 400);

    const order = await Order.findById(orderId);
    if (!order) return error(res, 'Order not found', 404);
    if (order.userId && order.userId.toString() !== req.userId) return error(res, 'You cannot verify this order', 403);
    if (order.paymentMethod !== 'razorpay') return error(res, 'This order is not an online payment order', 400);

    const payment = await Payment.findOne({ orderId: order._id });
    if (!payment || payment.razorpayOrderId !== razorpayOrderId) return error(res, 'Razorpay order does not match this order', 400);

    const { keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    const valid = expectedSignature.length === razorpaySignature.length && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature));
    if (!valid) {
      await Payment.findByIdAndUpdate(payment._id, { razorpayPaymentId, razorpaySignature, status: 'failed' });
      await Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed', status: order.status === 'placed' ? 'payment_failed' : order.status });
      return error(res, 'Payment signature verification failed', 400);
    }

    await Payment.findByIdAndUpdate(payment._id, { razorpayPaymentId, razorpaySignature, status: 'paid', amount: Number(order.total), userId: order.userId || null });
    const updatedOrder = await Order.findByIdAndUpdate(order._id, { paymentStatus: 'paid', status: order.status === 'payment_failed' ? 'placed' : order.status }, { new: true });
    return success(res, updatedOrder, 'Payment verified successfully');
  } catch (e: any) {
    return error(res, e.message || 'Failed to verify Razorpay payment', 500);
  }
});

// Razorpay webhook endpoint. Configure this URL in the Razorpay dashboard and use RAZORPAY_WEBHOOK_SECRET.
export async function handleRazorpayWebhook(req: any, res: any) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(500).json({ success: false, message: 'Razorpay webhook secret is not configured' });
    const signature = req.headers['x-razorpay-signature'];
    if (typeof signature !== 'string' || !Buffer.isBuffer(req.body)) return res.status(400).json({ success: false, message: 'Invalid webhook request' });
    const expected = crypto.createHmac('sha256', webhookSecret).update(req.body).digest('hex');
    if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return res.status(400).json({ success: false, message: 'Invalid webhook signature' });

    const event = JSON.parse(req.body.toString('utf8'));
    const paymentEntity = event?.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;
    if (!razorpayOrderId) return res.json({ success: true });

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) return res.json({ success: true });
    const order = await Order.findById(payment.orderId);
    if (!order) return res.json({ success: true });

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      await Payment.findByIdAndUpdate(payment._id, { status: 'paid', razorpayPaymentId: razorpayPaymentId || payment.razorpayPaymentId });
      await Order.findByIdAndUpdate(order._id, { paymentStatus: 'paid', status: order.status === 'payment_failed' ? 'placed' : order.status });
    } else if (event.event === 'payment.failed') {
      await Payment.findByIdAndUpdate(payment._id, { status: 'failed', razorpayPaymentId: razorpayPaymentId || payment.razorpayPaymentId });
      if (order.paymentStatus !== 'paid') await Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed', status: order.status === 'placed' ? 'payment_failed' : order.status });
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('Razorpay webhook error:', e);
    return res.status(500).json({ success: false });
  }
}

export default router;
