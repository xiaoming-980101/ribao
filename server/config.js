import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = parseInt(process.env.PORT || '3001', 10);
export const DB_FILE = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, '..', 'db.json');
export const DEFAULT_AI_API_URL = process.env.DEFAULT_AI_API_URL || 'https://openrouter.ai/api/v1';
export const DEFAULT_AI_MODEL = 'openrouter/free';
export const LEGACY_INVALID_MODELS = new Set([
  'qwen/qwen-3-coder:free'
]);
export const BCRYPT_ROUNDS = 10;
export const DIST_PATH = path.join(__dirname, '..', 'dist');
