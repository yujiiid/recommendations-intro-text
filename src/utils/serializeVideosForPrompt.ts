import type { NormalizedVideo } from '../types/video-metadata-api';
import { truncateText } from './truncateText';

const TOTAL_TRANSCRIPT_LENGTH = 16000;
const MAX_TRANSCRIPT_LENGTH_PER_VIDEO = 8000;
const MAX_DESCRIPTION_LENGTH = 1500;

export const serializeVideosForPrompt = (videos: NormalizedVideo[]): string => {
  const transcriptLengthPerVideo = Math.min(
    MAX_TRANSCRIPT_LENGTH_PER_VIDEO,
    Math.floor(TOTAL_TRANSCRIPT_LENGTH / Math.max(videos.length, 1)),
  );

  return JSON.stringify(
    videos.map((video) => ({
      id: video.displayId,
      title: video.title,
      description: truncateText(video.description, MAX_DESCRIPTION_LENGTH),
      tags: video.tags,
      transcript: truncateText(video.transcript, transcriptLengthPerVideo),
    })),
    null,
    2,
  );
};
