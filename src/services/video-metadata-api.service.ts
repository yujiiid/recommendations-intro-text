import { env } from '../config/env';
import type {
  NormalizedVideo,
  VideoMetadataApiResponse,
  VideoMetadataApiVideo,
} from '../types/video-metadata-api';
import { ExternalApiError, NotFoundError } from '../utils/errors';

const normalizeVideo = (video: VideoMetadataApiVideo): NormalizedVideo => {
  return {
    displayId: video.displayId,
    title: video.name,
    description: video.description ?? '',
    tags: video.tags ?? [],
    transcript: video.transcript ?? '',
  };
};

export const fetchVideoMetadata = async (
  videoId: string,
): Promise<NormalizedVideo> => {
  const url = new URL('/v3/videos/_search', env.VIDEO_METADATA_API_BASE_URL);

  url.search = new URLSearchParams({
    //brand: env.VIDEO_METADATA_DEFAULT_BRAND,
    //country: env.VIDEO_METADATA_DEFAULT_COUNTRY,
    // TODO: Remove when API is ready
    brand: 'dagbladet',
    country: 'no',
    sortBy: 'publishDate',
    publishState: 'published',
    order: 'desc',
    limit: '30',
    page: '1',
    q: videoId,
  }).toString();

  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new ExternalApiError('Failed to request Video Metadata API');
  }

  if (!response.ok) {
    throw new ExternalApiError('Video Metadata API returned an error');
  }

  const body = (await response.json()) as VideoMetadataApiResponse;
  const video = body.data?.[0];

  if (!video) {
    throw new NotFoundError(`Video with id "${videoId}" was not found`);
  }

  return normalizeVideo(video);
};
