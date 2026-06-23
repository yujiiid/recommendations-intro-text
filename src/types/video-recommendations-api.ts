export interface VideoRecommendationMedia {
  mediaId: string;
  title?: string;
  tags?: string;
  taxonomy?: string;
  duration?: number;
  publishedAt?: string;
  plays?: number;
  completionRate?: number;
  posterUrl?: string;
}

export interface VideoRecommendationMatch {
  media: VideoRecommendationMedia;
  score: number;
  similarityScore?: number;
  recencyScore?: number;
  engagementScore?: number;
  seen?: boolean;
}

export interface VideoRecommendationsResponse {
  query: string;
  matches: VideoRecommendationMatch[];
}
