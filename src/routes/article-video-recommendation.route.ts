import { Router } from 'express';
import { articleVideoRecommendationRequestSchema } from '../schemas/article-video-recommendation.schema';
import { generateVideoIntroText } from '../services/intro-text-generator.service';
import { findRecommendedVideoId } from '../services/related-videos-api.service';
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
      const recommendedVideoId = await findRecommendedVideoId(article.url);
      const videoMetadata = await fetchVideoMetadata(recommendedVideoId);
      const introText = await generateVideoIntroText({
        article,
        video: videoMetadata,
        options,
      });

      res.json({
        recommendedVideo: {
          id: recommendedVideoId,
        },
        intro: {
          text: introText,
          language: options.language,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
