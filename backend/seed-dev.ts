import fs from 'fs';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const URI_FILE = path.resolve(import.meta.dirname, '.mongodb-uri');

async function main() {
  console.log('[seed:mem] Starting MongoDB Memory Server...');
  const mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'smartfood_dev' },
  });
  const uri = mongoServer.getUri();
  console.log(`[seed:mem] MongoDB Memory Server running at: ${uri}`);

  // Must set before importing seed.ts so the module-level URI resolution picks it up
  process.env.MONGODB_URI = uri;
  fs.writeFileSync(URI_FILE, uri, 'utf-8');

  const { seed } = await import('./seeds/seed.js');
  await seed();

  await mongoServer.stop();
  console.log('[seed:mem] MongoDB Memory Server stopped.');
}

main().catch((err) => {
  console.error('[seed:mem] Failed:', err);
  process.exit(1);
});
