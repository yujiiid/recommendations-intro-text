import { Router } from 'express';
import {
  articleVideoRecommendationRequestSchema,
  videoPositionRequestSchema,
} from '../schemas/article-video-recommendation.schema';
import { generateVideoIntroText } from '../services/intro-text-generator.service';
import { findRecommendedVideoId } from '../services/video-recommendations-api.service';
import { recommendVideoInsertionIndex } from '../services/video-position-generator.service';
import { fetchVideoMetadata } from '../services/video-metadata-api.service';
import { ValidationError } from '../utils/errors';

export const articleVideoRecommendationRouter = Router();

articleVideoRecommendationRouter.post(
  '/article-video-recommendations',
  async (req, res, next) => {
    const parsedBody = articleVideoRecommendationRequestSchema.safeParse(
      req.body,
    );

    if (!parsedBody.success) {
      const message = parsedBody.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');

      next(new ValidationError(message));
      return;
    }

    try {
      const { article, options, aiPrompt } = parsedBody.data;
      const videoId = await findRecommendedVideoId(article.content);
      const videoMetadata = await fetchVideoMetadata(videoId);
      const { introText, warnings } = await generateVideoIntroText({
        article,
        video: videoMetadata,
        options,
        aiPrompt,
      });

      res.json({ videoId, introText, warnings });
    } catch (error) {
      next(error);
    }
  },
);

articleVideoRecommendationRouter.post(
  '/video-position',
  async (req, res, next) => {
    const parsedBody = videoPositionRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      const message = parsedBody.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');

      next(new ValidationError(message));
      return;
    }

    try {
      const { recommendedInsertionIndex, warnings } =
        await recommendVideoInsertionIndex(parsedBody.data);

      res.json({ recommendedInsertionIndex, warnings });
    } catch (error) {
      next(error);
    }
  },
);
