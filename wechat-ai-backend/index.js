import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import { apiBases } from '@ai-h5/shared';

import { userRouter } from './routes/user.js';
import { aiRouter } from './routes/ai.js';
import { swaggerSpec } from './swagger.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use(apiBases.user, userRouter);
app.use(apiBases.ai, aiRouter);

// const host = '10.3.20.101';
const host = 'localhost';

app.listen(config.port, host, () => {
  console.log(`Server running at http://${host}:${config.port}`);
});
