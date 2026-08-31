import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth';
import catalogRoutes from './routes/catalog';
import orderRoutes from './routes/orders';
import paymentRoutes, { handleRazorpayWebhook } from './routes/payments';
import bookingRoutes from './routes/bookings';
import dataRoutes from './routes/data';
import { error } from './utils/helpers';

export function createServer() {
  const app = express();
  const clientUrls = (process.env.CLIENT_URL || 'https://alnihar.vercel.app').split(',').map((url) => url.trim().replace(/\/$/, '')).filter(Boolean);

  // Render runs behind a proxy. Trust the first proxy so rate limiting uses the real client IP.
  app.set('trust proxy', 1);

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many authentication attempts. Please try again later.' } });
  const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many registration attempts. Please try again later.' } });
  const paymentLimiter = rateLimit({ windowMs: 5 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many payment requests. Please try again later.' } });
  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many requests. Please try again later.' } });

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: (origin, callback) => { if (!origin || clientUrls.includes(origin.replace(/\/$/, ''))) return callback(null, true); return callback(new Error('CORS origin not allowed')); }, credentials: true }));
  app.use(cookieParser());
  app.post('/api/payments/razorpay/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.get('/api/health', (_req, res) => res.json({ success: true, message: 'AL NIHAR API is running', timestamp: new Date().toISOString() }));
  app.use('/api/auth/register', registerLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/payments/razorpay/checkout', paymentLimiter);
  app.use('/api/payments/razorpay/verify', paymentLimiter);
  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api', dataRoutes);
  app.use((req, res) => error(res, `Route not found: ${req.method} ${req.path}`, 404));
  app.use((err: any, _req: any, res: any, _next: any) => { console.error('Server error:', err); error(res, err.message || 'Internal server error', 500); });
  return app;
}

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is not set');
  if (mongoose.connection.readyState === 0) { await mongoose.connect(mongoUri); console.log('✓ Connected to MongoDB Atlas'); }
}
