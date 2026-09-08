import { Router } from 'express';
import {
  DEFAULT_LANGUAGE_BY_COUNTRY,
  isSupportedBrand,
  isSupportedCountry,
  type SupportedSite,
} from '../config/supported-sites';
import { recommendationRequestSchema } from '../schemas/article-video-recommendation.schema';
import { generateFullModeRecommendation } from '../services/full-mode-recommendation-generator.service';
import { generateVideoIntroTexts } from '../services/intro-text-generator.service';
import {
  findRecommendedVideos,
  type RecommendedVideo,
} from '../services/video-recommendations-api.service';
import { recommendVideoInsertionIndex } from '../services/video-position-generator.service';
import { fetchVideoMetadata } from '../services/video-metadata-api.service';
import type { NormalizedVideo } from '../types/video-metadata-api';
import {
  NoAvailableVideoRecommendationsError,
  NotFoundError,
  UnsupportedBrandError,
  UnsupportedCountryError,
  ValidationError,
} from '../utils/errors';

export const articleVideoRecommendationRouter = Router();

const addIntroTextsToVideos = <Video>(
  videos: Video[],
  videoIntros: { introText: string }[],
): Array<Video & { introText: string }> =>
  videos.map((video, index) => ({
    ...video,
    introText: videoIntros[index].introText,
  }));

type VideoMetadataFetcher = (
  videoId: string,
  site: SupportedSite,
) => Promise<NormalizedVideo>;

const validateSite = (brand: string, country: string): SupportedSite => {
  if (!isSupportedCountry(country)) {
    throw new UnsupportedCountryError(country);
  }

  if (!isSupportedBrand(brand, country)) {
    throw new UnsupportedBrandError(brand, country);
  }

  return { brand, country };
};

export const fetchAvailableVideosWithMetadata = async (
  videos: RecommendedVideo[],
  site: SupportedSite,
  fetchMetadata: VideoMetadataFetcher = fetchVideoMetadata,
): Promise<{
  availableVideos: RecommendedVideo[];
  videosMetadata: NormalizedVideo[];
}> => {
  const results = await Promise.all(
    videos.map(async (video) => {
      try {
        return { video, metadata: await fetchMetadata(video.id, site) };
      } catch (error) {
        if (error instanceof NotFoundError) {
          return null;
        }

        throw error;
      }
    }),
  );
  const availableVideos = results.filter((result) => result !== null);

  if (availableVideos.length === 0) {
    throw new NoAvailableVideoRecommendationsError();
  }

  return {
    availableVideos: availableVideos.map(({ video }) => video),
    videosMetadata: availableVideos.map(({ metadata }) => metadata),
  };
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
      const site = validateSite(options.brand, options.country);
      const optionsWithLanguage = {
        ...options,
        language: options.language ?? DEFAULT_LANGUAGE_BY_COUNTRY[site.country],
      };

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
            site,
          );

          res.json({ videos, warnings: [] });
          return;
        }

        case 'videos-with-intro': {
          const recommendedVideos = await findRecommendedVideos(
            article.content,
            options.videoLimit,
            site,
          );
          const { availableVideos, videosMetadata } =
            await fetchAvailableVideosWithMetadata(recommendedVideos, site);
          const { videoIntros, warnings } = await generateVideoIntroTexts({
            article,
            videos: videosMetadata,
            options: optionsWithLanguage,
            aiPrompt,
          });

          res.json({
            videos: addIntroTextsToVideos(availableVideos, videoIntros),
            warnings,
          });
          return;
        }

        case 'full': {
          const recommendedVideos = await findRecommendedVideos(
            article.content,
            options.videoLimit,
            site,
          );
          const { availableVideos, videosMetadata } =
            await fetchAvailableVideosWithMetadata(recommendedVideos, site);
          const { recommendedInsertionIndex, videoIntros, warnings } =
            await generateFullModeRecommendation({
              article,
              videos: videosMetadata,
              options: optionsWithLanguage,
              aiPrompt,
            });

          res.json({
            videos: addIntroTextsToVideos(availableVideos, videoIntros),
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
