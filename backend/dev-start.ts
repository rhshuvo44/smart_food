import fs from 'fs';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const URI_FILE = path.resolve(import.meta.dirname, '.mongodb-uri');

async function main() {
  console.log('[dev] Starting MongoDB Memory Server...');
  const mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'smartfood_dev' },
  });
  const uri = mongoServer.getUri();
  console.log(`[dev] MongoDB Memory Server running at: ${uri}`);

  // Write URI to a file so seed script can find it
  fs.writeFileSync(URI_FILE, uri, 'utf-8');

  process.env.MONGODB_URI = uri;

  const { createApp } = await import('./src/app.js');
  const { env } = await import('./src/config/env.js');
  const { connectDatabase } = await import('./src/config/database.js');
  const { initializeSocketServer } = await import('./src/sockets/socket.server.js');
  const { logger } = await import('./src/config/logger.js');
  import('http').then(async (http) => {
    await connectDatabase();
    const app = createApp();
    const server = http.default.createServer(app);
    initializeSocketServer(server);
    server.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
    });
  });
}

main().catch(console.error);
