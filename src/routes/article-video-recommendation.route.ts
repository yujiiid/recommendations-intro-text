import { Router } from 'express';
import { recommendationRequestSchema } from '../schemas/article-video-recommendation.schema';
import { generateFullModeRecommendation } from '../services/full-mode-recommendation-generator.service';
import { generateVideoIntroTexts } from '../services/intro-text-generator.service';
import { findRecommendedVideos } from '../services/video-recommendations-api.service';
import { recommendVideoInsertionIndex } from '../services/video-position-generator.service';
import { fetchVideoMetadata } from '../services/video-metadata-api.service';
import { ValidationError } from '../utils/errors';

export const articleVideoRecommendationRouter = Router();

const addIntroTextsToVideos = <Video>(
  videos: Video[],
  videoIntros: { introText: string }[],
): Array<Video & { introText: string }> =>
  videos.map((video, index) => ({
    ...video,
    introText: videoIntros[index].introText,
  }));

const fetchAllVideoMetadata = (videos: { id: string }[]) => {
  return Promise.all(videos.map(({ id }) => fetchVideoMetadata(id)));
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

        case 'videos-only': {
          const videos = await findRecommendedVideos(
            article.content,
            options.videoLimit,
          );

          res.json({ videos, warnings: [] });
          return;
        }

        case 'videos-with-intro': {
          const videos = await findRecommendedVideos(
            article.content,
            options.videoLimit,
          );
          const videoMetadata = await fetchAllVideoMetadata(videos);
          const { videoIntros, warnings } = await generateVideoIntroTexts({
            article,
            videos: videoMetadata,
            options,
            aiPrompt,
          });

          res.json({
            videos: addIntroTextsToVideos(videos, videoIntros),
            warnings,
          });
          return;
        }

        case 'full': {
          const videos = await findRecommendedVideos(
            article.content,
            options.videoLimit,
          );
          const videoMetadata = await fetchAllVideoMetadata(videos);
          const { recommendedInsertionIndex, videoIntros, warnings } =
            await generateFullModeRecommendation({
              article,
              videos: videoMetadata,
              options,
              aiPrompt,
            });

          res.json({
            videos: addIntroTextsToVideos(videos, videoIntros),
            recommendedInsertionIndex,
            warnings,
          });
          return;
        }
      }
    } catch (error) {
      next(error);
    }
  },
);
