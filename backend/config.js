import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const cwd = process.cwd();
const baseEnvPath = path.resolve(cwd, '.env');
const envName = process.env.NODE_ENV || 'development';
const envPath = path.resolve(cwd, `.env.${envName}`);

// Load base .env first, then override with environment-specific file if present.
dotenv.config({ path: baseEnvPath });
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
  wxAppId: process.env.WX_APP_ID,
  wxAppSecret: process.env.WX_APP_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  port: process.env.PORT || 3000,
  dbFile: process.env.DB_FILE,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  rateLimit: {
    login: {
      windowMs: numberFromEnv('LOGIN_RATE_LIMIT_WINDOW_MS', 10 * 60 * 1000),
      max: numberFromEnv('LOGIN_RATE_LIMIT_MAX', 20)
    },
    ai: {
      windowMs: numberFromEnv('AI_RATE_LIMIT_WINDOW_MS', 60 * 1000),
      max: numberFromEnv('AI_RATE_LIMIT_MAX', 60)
    },
    speech: {
      windowMs: numberFromEnv('SPEECH_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000),
      max: numberFromEnv('SPEECH_RATE_LIMIT_MAX', 30)
    }
  },
  jobs: {
    cleanup: {
      everyMs: numberFromEnv('CLEANUP_UPLOADS_EVERY_MS', 60 * 60 * 1000),
      maxAgeMs: numberFromEnv('UPLOAD_FILE_MAX_AGE_MS', 24 * 60 * 60 * 1000)
    }
  }
};
