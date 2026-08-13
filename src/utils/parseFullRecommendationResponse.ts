import { z } from 'zod';
import { ExternalApiError } from './errors';
import { parseAiJsonResponse } from './parseAiJsonResponse';
import {
  generatedVideoIntrosSchema,
  type GeneratedVideoIntro,
  validateAndOrderGeneratedVideoIntros,
} from './parseGeneratedVideoIntros';

const fullRecommendationResponseSchema = z
  .object({
    recommendedInsertionIndex: z.number().int().positive(),
    videos: generatedVideoIntrosSchema,
  })
  .strict();

interface FullRecommendationResponse {
  recommendedInsertionIndex: number;
  videoIntros: GeneratedVideoIntro[];
}

export const parseFullRecommendationResponse = (
  responseText: string,
  paragraphCount: number,
  expectedVideoIds: string[],
): FullRecommendationResponse => {
  const parsedJson = parseAiJsonResponse(responseText, 'full recommendation');
  const parsedResponse = fullRecommendationResponseSchema.safeParse(parsedJson);

  if (!parsedResponse.success) {
    throw new ExternalApiError(
      'AI Gateway returned an invalid full recommendation payload',
    );
  }

  const { recommendedInsertionIndex, videos } = parsedResponse.data;

  if (recommendedInsertionIndex > paragraphCount) {
    throw new ExternalApiError(
      'AI Gateway returned an out-of-range paragraph index for full recommendation',
    );
  }

  return {
    recommendedInsertionIndex,
    videoIntros: validateAndOrderGeneratedVideoIntros(videos, expectedVideoIds),
  };
};
