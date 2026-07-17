import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export { env } from './env.js';
export { connectDatabase, disconnectDatabase } from './database.js';
export { logger } from './logger.js';
export type { Config } from './env.js';
