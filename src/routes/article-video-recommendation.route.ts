import { Router } from 'express';
import {
  type recommendationRequest,
  recommendationRequestSchema,
} from '../schemas/article-video-recommendation.schema';
import { generateVideoIntroText } from '../services/intro-text-generator.service';
import { findRecommendedVideoId } from '../services/video-recommendations-api.service';
import { recommendVideoInsertionIndex } from '../services/video-position-generator.service';
import { fetchVideoMetadata } from '../services/video-metadata-api.service';
import type { PromptTemplateWarning } from '../utils/prompt-template';
import { ValidationError } from '../utils/errors';

export const articleVideoRecommendationRouter = Router();

type VideoWithIntroInput = Pick<
  recommendationRequest,
  'article' | 'options' | 'aiPrompt'
>;

const generateVideoWithIntro = async ({
  article,
  options,
  aiPrompt,
}: VideoWithIntroInput): Promise<{
  videoId: string;
  introText: string;
  warnings: PromptTemplateWarning[];
}> => {
  const videoId = await findRecommendedVideoId(article.content);
  const videoMetadata = await fetchVideoMetadata(videoId);
  const { introText, warnings } = await generateVideoIntroText({
    article,
    video: videoMetadata,
    options,
    aiPrompt,
  });

  return { videoId, introText, warnings };
};

articleVideoRecommendationRouter.post(
  '/article-video-recommendation',
  async (req, res, next) => {
    const parsedBody = recommendationRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      const message = parsedBody.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');

      next(new ValidationError(message));
      return;
    }

    try {
      const { article, options, mode, aiPrompt } = parsedBody.data;

      switch (mode) {
        case 'position-only': {
          const { recommendedInsertionIndex, warnings } =
            await recommendVideoInsertionIndex({
              title: article.title,
              content: article.content,
              tags: article.tags,
              aiPrompt: aiPrompt,
            });

          res.json({ recommendedInsertionIndex, warnings });
          return;
        }

        case 'video-only': {
          const videoId = await findRecommendedVideoId(article.content);

          res.json({ videoId, warnings: [] });
          return;
        }

        case 'video-with-intro': {
          const { videoId, introText, warnings } = await generateVideoWithIntro(
            { article, options, aiPrompt },
          );

          res.json({ videoId, introText, warnings });
          return;
        }

        case 'full': {
          const [position, videoRecommendation] = await Promise.all([
            recommendVideoInsertionIndex({
              title: article.title,
              content: article.content,
              tags: article.tags,
              aiPrompt: aiPrompt,
            }),
            generateVideoWithIntro({ article, options, aiPrompt }),
          ]);

          res.json({
            videoId: videoRecommendation.videoId,
            introText: videoRecommendation.introText,
            recommendedInsertionIndex: position.recommendedInsertionIndex,
            warnings: [...position.warnings, ...videoRecommendation.warnings],
          });
          return;
        }
      }
    } catch (error) {
      next(error);
    }
  },
);
