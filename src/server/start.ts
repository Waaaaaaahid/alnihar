import 'dotenv/config';
import { createServer, connectDB } from './index';

const app = createServer();
const PORT = Number(process.env.PORT) || 10000;

async function start() {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ AL NIHAR API listening on port ${PORT}`);
    });
  } catch (err: any) {
    console.error('✗ Failed to start AL NIHAR API:', err?.message || err);
    process.exit(1);
  }
}

start();
