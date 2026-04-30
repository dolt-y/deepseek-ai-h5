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

export const config = {
  wxAppId: process.env.WX_APP_ID,
  wxAppSecret: process.env.WX_APP_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  port: process.env.PORT || 3000,
  dbFile: process.env.DB_FILE,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL
};
