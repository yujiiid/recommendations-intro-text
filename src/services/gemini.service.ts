import OpenAI from 'openai';
import { env } from '../config/env';
import { ExternalApiError } from '../utils/errors';

const ai = new OpenAI({
  apiKey: env.CF_AIG_TOKEN,
  baseURL: env.AI_GATEWAY_BASE_URL,
  defaultHeaders: {
    'cf-aig-metadata': JSON.stringify({
      application: 'article-video-recommendation-service',
      environment: env.NODE_ENV,
    }),
  },
});

export const generateResult = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.chat.completions.create({
      model: env.AI_GATEWAY_MODEL,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.choices[0]?.message?.content?.trim();

    if (!text) {
      throw new ExternalApiError('AI Gateway returned an empty response');
    }

    return text;
  } catch (error) {
    if (error instanceof ExternalApiError) {
      throw error;
    }

    throw new ExternalApiError('AI Gateway request failed');
  }
};
