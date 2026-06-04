import { z } from 'zod';
import { truncateText } from '../utils/truncateText';
import { ExternalApiError } from '../utils/errors';
import {
  type PromptTemplateWarning,
  renderPromptTemplate,
} from '../utils/prompt-template';
import {
  DEFAULT_VIDEO_POSITION_PROMPT_TEMPLATE,
  VIDEO_POSITION_REQUIRED_PLACEHOLDERS,
} from '../config/prompt-templates';
import { generateResult } from './gemini.service';

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

const geminiVideoPositionResponseSchema = z.object({
  recommendedInsertionIndex: z.number().int().positive(),
});

const decodeHtmlEntities = (text: string): string => {
  const namedEntities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  const withNamedEntities = Object.entries(namedEntities).reduce(
    (accumulator, [entity, value]) => accumulator.split(entity).join(value),
    text,
  );

  const decodeCodePoint = (rawCode: string, radix: number, fallback: string): string => {
    const parsedCode = Number.parseInt(rawCode, radix);

    if (
      Number.isNaN(parsedCode) ||
      parsedCode < 0 ||
      parsedCode > 0x10ffff
    ) {
      return fallback;
    }

    try {
      return String.fromCodePoint(parsedCode);
    } catch {
      return fallback;
    }
  };

  return withNamedEntities
    .replace(/&#(\d+);/g, (_match, code) => {
      return decodeCodePoint(code, 10, _match);
    })
    .replace(/&#x([\da-f]+);/gi, (_match, code) => {
      return decodeCodePoint(code, 16, _match);
    });
};

const extractParagraphsFromHtml = (html: string): string[] => {
  const paragraphRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];

  for (const match of html.matchAll(paragraphRegex)) {
    const paragraphHtml = match[1];
    const paragraphText = decodeHtmlEntities(
      paragraphHtml
        .replace(/<br\s*\/?\s*>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .trim(),
    )
      .replace(/\s+/g, ' ')
      .trim();

    if (paragraphText) {
      paragraphs.push(paragraphText);
    }
  }

  return paragraphs;
};

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

const parseGeminiVideoPositionResponse = (
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
    throw new ExternalApiError('Gemini API returned invalid JSON for video position');
  }

  const jsonText = cleanedResponse.slice(jsonStartIndex, jsonEndIndex + 1);

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new ExternalApiError('Gemini API returned malformed JSON for video position');
  }

  const parsedResponse = geminiVideoPositionResponseSchema.safeParse(parsedJson);

  if (!parsedResponse.success) {
    throw new ExternalApiError('Gemini API returned an invalid video position payload');
  }

  const { recommendedInsertionIndex } = parsedResponse.data;

  if (recommendedInsertionIndex > paragraphCount) {
    throw new ExternalApiError(
      'Gemini API returned an out-of-range paragraph index for video position',
    );
  }

  return recommendedInsertionIndex;
};

export const recommendVideoInsertionIndex = async (
  input: GenerateVideoPositionInput,
): Promise<VideoPositionRecommendationResult> => {
  const paragraphs = extractParagraphsFromHtml(input.content);

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

  const geminiResponse = await generateResult(prompt);

  return {
    recommendedInsertionIndex: parseGeminiVideoPositionResponse(
      geminiResponse,
      paragraphs.length,
    ),
    warnings,
  };
};
