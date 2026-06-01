import { z } from 'zod';
import { truncateText } from '../utils/truncateText';
import { ExternalApiError } from '../utils/errors';
import { generateText } from './gemini.service';

interface GenerateVideoPositionInput {
  title: string;
  content: string;
  tags: string[];
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

const buildPrompt = (input: { title: string; tags: string[]; paragraphs: string[] }) => {
  const numberedParagraphs = truncateText(
    input.paragraphs
      .map((paragraph, index) => `${index + 1}. ${truncateText(paragraph, 1200)}`)
      .join('\n'),
    20000,
  );

  return `
You are analyzing an article and choosing the best position for inserting a generic related video recommendation block.

The exact video is not known yet. Your task is only to find a natural semantic break in the article.

Choose the paragraph number AFTER which the video block should be inserted.

Rules:
- Paragraph numbering starts from 1.
- Return only a valid paragraph number from the provided list.
- Prefer a position after a completed thought or section.
- Avoid splitting a sentence, argument, explanation, quote, or tightly connected group of paragraphs.
- Avoid inserting after the final paragraph unless there is no better option.
- Do not rewrite the article.
- Do not recommend a video.
- Return JSON only.

Article title:
${input.title}

Article tags:
${input.tags.join(', ') || 'No tags'}

Paragraphs:
${numberedParagraphs}

Return exactly this JSON shape:
{
  "recommendedInsertionIndex": number
}
`.trim();
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
): Promise<number | null> => {
  const paragraphs = extractParagraphsFromHtml(input.content);

  if (paragraphs.length < 2) {
    return null;
  }

  const prompt = buildPrompt({
    title: input.title,
    tags: input.tags,
    paragraphs,
  });

  const geminiResponse = await generateText(prompt);

  return parseGeminiVideoPositionResponse(geminiResponse, paragraphs.length);
};
