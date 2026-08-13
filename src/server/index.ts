import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import catalogRoutes from './routes/catalog';
import orderRoutes from './routes/orders';
import dataRoutes from './routes/data';
import { error } from './utils/helpers';

export function createServer() {
  const app = express();

  app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'AL NIHAR API is running', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api', dataRoutes);

  // 404
  app.use((req, res) => {
    error(res, `Route not found: ${req.method} ${req.path}`, 404);
  });

  // Error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Server error:', err);
    error(res, err.message || 'Internal server error', 500);
  });

  return app;
}

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is not set');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB Atlas');
  }
}
