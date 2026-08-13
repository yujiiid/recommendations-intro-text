import { ExternalApiError } from './errors';

export const parseAiJsonResponse = (
  responseText: string,
  operation: string,
): unknown => {
  const cleanedResponse = responseText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    return JSON.parse(cleanedResponse) as unknown;
  } catch {
    throw new ExternalApiError(
      `AI Gateway returned invalid JSON for ${operation}`,
    );
  }
};
