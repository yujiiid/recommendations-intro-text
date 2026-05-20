export interface VideoMetadataApiVideo {
  displayId: string;
  name: string;
  description?: string;
  tags?: string[];
  transcript?: string;
}

export interface VideoMetadataApiResponse {
  data?: VideoMetadataApiVideo[];
}

export interface NormalizedVideo {
  displayId: string;
  title: string;
  description: string;
  tags: string[];
  transcript: string;
}
