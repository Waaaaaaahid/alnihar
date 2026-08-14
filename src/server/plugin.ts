import 'dotenv/config';
import { Plugin } from 'vite';
import { createServer, connectDB } from './index';
import { seedMenuIfEmpty } from './seed-menu';

let dbConnected = false;

export function alNiharServerPlugin(): Plugin {
  return {
    name: 'al-nihar-server',
    async configureServer(viteServer) {
      const app = createServer();

      // Connect to MongoDB and auto-seed the menu before serving any API
      // requests, so /api calls never hit an unconnected database.
      if (!dbConnected) {
        dbConnected = true;
        try {
          await connectDB();
          await seedMenuIfEmpty();
        } catch (err: any) {
          console.error('✗ MongoDB connection failed:', err?.message || err);
          console.error('  Check MONGO_URI in your .env file and make sure the cluster is reachable.');
        }
      }

      // Mount the Express app before Vite's middleware
      viteServer.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api')) {
          app(req as any, res as any, next);
        } else {
          next();
        }
      });
    },
  };
}
