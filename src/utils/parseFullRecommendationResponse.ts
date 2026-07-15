import { z } from 'zod';
import { cleanVideoIntroText } from './cleanVideoIntroText';
import { ExternalApiError } from './errors';

const fullRecommendationResponseSchema = z.object({
  recommendedInsertionIndex: z.number().int().positive(),
  introText: z.string().min(1),
});

interface FullRecommendationResponse {
  recommendedInsertionIndex: number;
  introText: string;
}

export const parseFullRecommendationResponse = (
  responseText: string,
  paragraphCount: number,
): FullRecommendationResponse => {
  const cleanedResponse = responseText
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  const jsonStartIndex = cleanedResponse.indexOf('{');
  const jsonEndIndex = cleanedResponse.lastIndexOf('}');

  if (
    jsonStartIndex === -1 ||
    jsonEndIndex === -1 ||
    jsonEndIndex < jsonStartIndex
  ) {
    throw new ExternalApiError(
      'AI Gateway returned invalid JSON for full recommendation',
    );
  }

  const jsonText = cleanedResponse.slice(jsonStartIndex, jsonEndIndex + 1);

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new ExternalApiError(
      'AI Gateway returned malformed JSON for full recommendation',
    );
  }

  const parsedResponse = fullRecommendationResponseSchema.safeParse(parsedJson);

  if (!parsedResponse.success) {
    throw new ExternalApiError(
      'AI Gateway returned an invalid full recommendation payload',
    );
  }

  const { recommendedInsertionIndex, introText } = parsedResponse.data;

  if (recommendedInsertionIndex > paragraphCount) {
    throw new ExternalApiError(
      'AI Gateway returned an out-of-range paragraph index for full recommendation',
    );
  }

  const cleanedIntroText = cleanVideoIntroText(introText);

  if (!cleanedIntroText) {
    throw new ExternalApiError(
      'AI Gateway returned an empty intro text for full recommendation',
    );
  }

  return {
    recommendedInsertionIndex,
    introText: cleanedIntroText,
  };
};
