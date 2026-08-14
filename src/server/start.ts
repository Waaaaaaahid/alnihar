import 'dotenv/config';
import { createServer, connectDB } from './index';
import { seedMenuIfEmpty } from './seed-menu';

const app = createServer();
const PORT = Number(process.env.PORT) || 10000;

async function start() {
  try {
    await connectDB();

    // Seed the menu when empty and keep the known 70 menu item images fresh
    // when the existing MongoDB menu is already populated.
    await seedMenuIfEmpty();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ AL NIHAR API listening on port ${PORT}`);
    });
  } catch (err: any) {
    console.error('✗ Failed to start AL NIHAR API:', err?.message || err);
    process.exit(1);
  }
}

start();
