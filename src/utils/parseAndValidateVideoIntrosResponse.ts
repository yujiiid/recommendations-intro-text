import { z } from 'zod';
import { ExternalApiError } from './errors';
import { parseAiJsonResponse } from './parseAiJsonResponse';
import {
  generatedVideoIntrosSchema,
  type GeneratedVideoIntro,
  validateAndOrderGeneratedVideoIntros,
} from './parseGeneratedVideoIntros';

const videoIntrosResponseSchema = z
  .object({ videos: generatedVideoIntrosSchema })
  .strict();

export const parseAndValidateVideoIntrosResponse = (
  responseText: string,
  expectedVideoIds: string[],
): GeneratedVideoIntro[] => {
  const parsedJson = parseAiJsonResponse(responseText, 'video intros');
  const parsedResponse = videoIntrosResponseSchema.safeParse(parsedJson);

  if (!parsedResponse.success) {
    throw new ExternalApiError(
      'AI Gateway returned an invalid video intros payload',
    );
  }

  return validateAndOrderGeneratedVideoIntros(
    parsedResponse.data.videos,
    expectedVideoIds,
  );
};
