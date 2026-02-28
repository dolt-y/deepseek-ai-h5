import dotenv from 'dotenv';
dotenv.config();

export const config = {
  wxAppId: process.env.WX_APP_ID,
  wxAppSecret: process.env.WX_APP_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  port: process.env.PORT || 3000,
  dbFile: process.env.DB_FILE,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL
};
