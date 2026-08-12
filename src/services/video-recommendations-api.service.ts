import { env } from '../config/env';
import type {
  VideoRecommendationMatch,
  VideoRecommendationsResponse,
} from '../types/video-recommendations-api';
import { ExternalApiError, NotFoundError } from '../utils/errors';

export interface RecommendedVideo {
  id: string;
  title?: string;
  tags?: string;
  duration?: number;
  posterUrl?: string;
}

const isVideoRecommendationMatch = (
  value: unknown,
): value is VideoRecommendationMatch => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const match = value as Partial<VideoRecommendationMatch>;
  const media = match.media;

  return (
    typeof match.score === 'number' &&
    !!media &&
    typeof media === 'object' &&
    typeof media.mediaId === 'string'
  );
};

const parseVideoRecommendations = (
  value: unknown,
): VideoRecommendationsResponse => {
  if (!value || typeof value !== 'object') {
    throw new ExternalApiError(
      'Video Recommendations API returned invalid data',
    );
  }

  const response = value as Partial<VideoRecommendationsResponse>;

  if (
    typeof response.query !== 'string' ||
    !Array.isArray(response.matches) ||
    !response.matches.every(isVideoRecommendationMatch)
  ) {
    throw new ExternalApiError(
      'Video Recommendations API returned invalid data',
    );
  }

  return response as VideoRecommendationsResponse;
};

const findBestMatch = (
  matches: VideoRecommendationMatch[],
): VideoRecommendationMatch | undefined => {
  return matches.reduce<VideoRecommendationMatch | undefined>(
    (bestMatch, currentMatch) => {
      if (!bestMatch || currentMatch.score > bestMatch.score) {
        return currentMatch;
      }

      return bestMatch;
    },
    undefined,
  );
};

const getResponseErrorMessage = async (response: Response): Promise<string> => {
  const responseBody = await response.text();

  if (!responseBody) {
    return '';
  }

  try {
    const parsedBody = JSON.parse(responseBody) as { error?: unknown };

    if (typeof parsedBody.error === 'string') {
      return parsedBody.error;
    }
  } catch {
    // Fall back to the raw response body below.
  }

  return responseBody.slice(0, 500);
};

export const findRecommendedVideo = async (
  articleContent: string,
): Promise<RecommendedVideo> => {
  const url = new URL(env.VIDEO_RECOMMENDATIONS_API_URL);

  url.searchParams.set('q', articleContent);
  url.searchParams.set('limit', '1');

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        accept: 'application/json',
      },
    });
  } catch {
    throw new ExternalApiError('Failed to request Video Recommendations API');
  }

  if (!response.ok) {
    const responseErrorMessage = await getResponseErrorMessage(response);
    const details = responseErrorMessage ? `: ${responseErrorMessage}` : '';

    throw new ExternalApiError(
      `Video Recommendations API returned ${response.status} ${response.statusText}${details}`,
    );
  }

  const recommendations = parseVideoRecommendations(await response.json());
  const bestMatch = findBestMatch(recommendations.matches);

  if (!bestMatch) {
    throw new NotFoundError('No video recommendations found for article');
  }

  const { mediaId, title, tags, duration, posterUrl } = bestMatch.media;

  return { id: mediaId, title, tags, duration, posterUrl };
};
