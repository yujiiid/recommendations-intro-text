import { Router } from 'express';
import {
  articleVideoRecommendationRequestSchema,
  videoPositionRequestSchema,
} from '../schemas/article-video-recommendation.schema';
import { generateVideoIntroText } from '../services/intro-text-generator.service';
import { findRecommendedVideoId } from '../services/related-videos-api.service';
import { recommendVideoInsertionIndex } from '../services/video-position-generator.service';
import { fetchVideoMetadata } from '../services/video-metadata-api.service';
import { ValidationError } from '../utils/errors';

export const articleVideoRecommendationRouter = Router();

articleVideoRecommendationRouter.post(
  '/article-video-recommendations',
  async (req, res, next) => {
    const parsedBody = articleVideoRecommendationRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      const message = parsedBody.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');

      next(new ValidationError(message));
      return;
    }

    try {
      const { article, options } = parsedBody.data;
      const videoId = await findRecommendedVideoId(article.url);
      const videoMetadata = await fetchVideoMetadata(videoId);
      const introText = await generateVideoIntroText({
        article,
        video: videoMetadata,
        options,
      });

      res.json({ videoId, introText });
    } catch (error) {
      next(error);
    }
  },
);

articleVideoRecommendationRouter.post('/video-position', async (req, res, next) => {
  const parsedBody = videoPositionRequestSchema.safeParse(req.body);

  if (!parsedBody.success) {
    const message = parsedBody.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    next(new ValidationError(message));
    return;
  }

  try {
    const recommendedInsertionIndex = await recommendVideoInsertionIndex(parsedBody.data);

    res.json({ recommendedInsertionIndex });
  } catch (error) {
    next(error);
  }
});
