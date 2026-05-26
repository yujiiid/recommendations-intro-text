import express from 'express';
import { env } from './config/env';
import { articleVideoRecommendationRouter } from './routes/article-video-recommendation.route';
import { globalErrorHandler } from './utils/errors';

export const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(articleVideoRecommendationRouter);

app.use(globalErrorHandler);
