import { env } from '../config/env';
import type { RelatedVideo } from '../types/related-videos-api';
import { ExternalApiError, NotFoundError } from '../utils/errors';

const isRelatedVideo = (value: unknown): value is RelatedVideo => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const video = value as Partial<RelatedVideo>;

  return (
    typeof video.score === 'number' &&
    typeof video.contentHubId === 'string' &&
    typeof video.videoId === 'string'
  );
};

const parseRelatedVideos = (value: unknown): RelatedVideo[] => {
  if (!Array.isArray(value) || !value.every(isRelatedVideo)) {
    throw new ExternalApiError('Related Videos API returned invalid data');
  }

  return value;
};

const findBestVideo = (videos: RelatedVideo[]): RelatedVideo | undefined => {
  return videos.reduce<RelatedVideo | undefined>((bestVideo, currentVideo) => {
    if (!bestVideo || currentVideo.score > bestVideo.score) {
      return currentVideo;
    }

    return bestVideo;
  }, undefined);
};

export const findRecommendedVideoId = async (
  articleUrl: string,
): Promise<string> => {
  const baseUrl = env.RELATED_VIDEOS_API_BASE_URL.replace(/\/$/, '');
  const url = new URL(`${baseUrl}/related-videos-for-article`);

  url.searchParams.set('url', articleUrl);

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        accept: 'application/json',
      },
    });
  } catch {
    throw new ExternalApiError('Failed to request Related Videos API');
  }

  if (!response.ok) {
    const responseBody = await response.text();
    const details = responseBody ? `: ${responseBody.slice(0, 500)}` : '';

    throw new ExternalApiError(
      `Related Videos API returned ${response.status} ${response.statusText}${details}`,
    );
  }

  const videos = parseRelatedVideos(await response.json());
  const bestVideo = findBestVideo(videos);

  if (!bestVideo) {
    throw new NotFoundError('No related videos found for article');
  }

  // TODO: Remove hardcoded id when API is ready
  //return bestVideo.videoId;
  return 'BVUvnuOc';
};
