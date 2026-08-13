import { Plugin } from 'vite';
import { createServer, connectDB } from './index';

let dbConnected = false;

export function alNiharServerPlugin(): Plugin {
  return {
    name: 'al-nihar-server',
    configureServer(viteServer) {
      const app = createServer();

      // Connect to MongoDB
      if (!dbConnected) {
        dbConnected = true;
        connectDB().catch((err) => {
          console.error('✗ MongoDB connection failed:', err.message);
        });
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
