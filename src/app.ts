import express from 'express';
import { env } from './config/env';
import { introRouter } from './routes/intro.route';
import { globalErrorHandler } from './utils/errors';

export const app = express();

app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(introRouter);

app.use(globalErrorHandler);
