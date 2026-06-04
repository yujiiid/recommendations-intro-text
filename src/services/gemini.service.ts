import { GoogleGenAI } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';
import { env } from '../config/env';
import { ExternalApiError } from '../utils/errors';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export const generateResult = async (prompt: string): Promise<string> => {
  let response: GenerateContentResponse;

  try {
    response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
    });
  } catch {
    throw new ExternalApiError('Gemini API request failed');
  }

  const text = response.text?.trim();

  if (!text) {
    throw new ExternalApiError('Gemini API returned an empty response');
  }

  return text;
};
