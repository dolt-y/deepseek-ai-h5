import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

import { userRouter } from './routes/user.js';
import { aiRouter } from './routes/ai.js';
import { swaggerSpec } from './swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, 'uploads');

const app = express();
const envName = process.env.NODE_ENV || 'development';
if (envName === 'development') {
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  if (corsOrigin === '*') {
    app.use(cors());
  } else {
    const origins = corsOrigin.split(',').map((item) => item.trim()).filter(Boolean);
    app.use(cors({ origin: origins }));
  }
}
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadDir));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api/user', userRouter);
app.use('/api/ai', aiRouter);

const host = process.env.HOST || (envName === 'development' ? '0.0.0.0' : '127.0.0.1');

app.listen(config.port, host, () => {
  console.log(`Server running at http://${host}:${config.port}`);
});
