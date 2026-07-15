import { z } from 'zod';
import { truncateText } from '../utils/truncateText';
import { ExternalApiError } from '../utils/errors';
import { extractArticleParagraphs } from '../utils/extractArticleParagraphs';
import {
  type PromptTemplateWarning,
  renderPromptTemplate,
} from '../utils/prompt-template';
import {
  DEFAULT_VIDEO_POSITION_PROMPT_TEMPLATE,
  VIDEO_POSITION_REQUIRED_PLACEHOLDERS,
} from '../config/prompt-templates';
import { generateResult } from './ai-gateway.service';

interface GenerateVideoPositionInput {
  title: string;
  content: string;
  tags: string[];
  aiPrompt?: string;
}

interface VideoPositionRecommendationResult {
  recommendedInsertionIndex: number | null;
  warnings: PromptTemplateWarning[];
}

const aiGatewayVideoPositionResponseSchema = z.object({
  recommendedInsertionIndex: z.number().int().positive(),
});

const buildPrompt = (
  input: {
    title: string;
    tags: string[];
    paragraphs: string[];
    aiPrompt?: string;
  },
): { prompt: string; warnings: PromptTemplateWarning[] } => {
  const articleParagraphs = truncateText(
    input.paragraphs
      .map((paragraph, index) => `${index + 1}. ${truncateText(paragraph, 1200)}`)
      .join('\n'),
    20000,
  );

  const { renderedPrompt, warnings } = renderPromptTemplate({
    template: input.aiPrompt,
    fallbackTemplate: DEFAULT_VIDEO_POSITION_PROMPT_TEMPLATE,
    context: {
      articleTitle: input.title,
      articleTags: input.tags.join(', ') || 'No tags',
      articleParagraphs,
    },
    requiredPlaceholders: VIDEO_POSITION_REQUIRED_PLACEHOLDERS,
  });

  return {
    prompt: renderedPrompt,
    warnings,
  };
};

const parseAiGatewayVideoPositionResponse = (
  responseText: string,
  paragraphCount: number,
): number => {
  const cleanedResponse = responseText
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  const jsonStartIndex = cleanedResponse.indexOf('{');
  const jsonEndIndex = cleanedResponse.lastIndexOf('}');

  if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex < jsonStartIndex) {
    throw new ExternalApiError('AI Gateway returned invalid JSON for video position');
  }

  const jsonText = cleanedResponse.slice(jsonStartIndex, jsonEndIndex + 1);

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new ExternalApiError('AI Gateway returned malformed JSON for video position');
  }

  const parsedResponse = aiGatewayVideoPositionResponseSchema.safeParse(parsedJson);

  if (!parsedResponse.success) {
    throw new ExternalApiError('AI Gateway returned an invalid video position payload');
  }

  const { recommendedInsertionIndex } = parsedResponse.data;

  if (recommendedInsertionIndex > paragraphCount) {
    throw new ExternalApiError(
      'AI Gateway returned an out-of-range paragraph index for video position',
    );
  }

  return recommendedInsertionIndex;
};

export const recommendVideoInsertionIndex = async (
  input: GenerateVideoPositionInput,
): Promise<VideoPositionRecommendationResult> => {
  const paragraphs = extractArticleParagraphs(input.content);

  if (paragraphs.length < 2) {
    return {
      recommendedInsertionIndex: null,
      warnings: [],
    };
  }

  const { prompt, warnings } = buildPrompt({
    title: input.title,
    tags: input.tags,
    paragraphs,
    aiPrompt: input.aiPrompt,
  });

  const aiGatewayResponse = await generateResult(prompt);

  return {
    recommendedInsertionIndex: parseAiGatewayVideoPositionResponse(
      aiGatewayResponse,
      paragraphs.length,
    ),
    warnings,
  };
};
