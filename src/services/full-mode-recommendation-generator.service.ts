import {
  DEFAULT_FULL_RECOMMENDATION_PROMPT_TEMPLATE,
  FULL_RECOMMENDATION_REQUIRED_PLACEHOLDERS,
} from '../config/prompt-templates';
import type { NormalizedVideo } from '../types/video-metadata-api';
import { extractArticleParagraphs } from '../utils/extractArticleParagraphs';
import { parseFullRecommendationResponse } from '../utils/parseFullRecommendationResponse';
import {
  type PromptTemplateWarning,
  renderPromptTemplate,
} from '../utils/prompt-template';
import { truncateText } from '../utils/truncateText';
import { generateResult } from './ai-gateway.service';
import { generateVideoIntroText } from './intro-text-generator.service';

interface GenerateFullModeRecommendationInput {
  article: {
    title: string;
    content: string;
    tags: string[];
  };
  video: NormalizedVideo;
  options: {
    language: string;
  };
  aiPrompt?: string;
}

interface FullModeRecommendationResult {
  recommendedInsertionIndex: number | null;
  introText: string;
  warnings: PromptTemplateWarning[];
}

const buildPrompt = (input: {
  title: string;
  tags: string[];
  paragraphs: string[];
  video: NormalizedVideo;
  language: string;
  aiPrompt?: string;
}): { prompt: string; warnings: PromptTemplateWarning[] } => {
  const articleParagraphs = truncateText(
    input.paragraphs
      .map((paragraph, index) => `${index + 1}. ${truncateText(paragraph, 1200)}`)
      .join('\n'),
    20000,
  );
  const videoTranscript = truncateText(input.video.transcript, 8000);

  const { renderedPrompt, warnings } = renderPromptTemplate({
    template: input.aiPrompt,
    fallbackTemplate: DEFAULT_FULL_RECOMMENDATION_PROMPT_TEMPLATE,
    context: {
      responseLanguage: input.language,
      articleTitle: input.title,
      articleTags: input.tags.join(', ') || 'No tags',
      articleParagraphs,
      videoTitle: input.video.title,
      videoTags: input.video.tags.join(', ') || 'No tags',
      videoTranscript,
    },
    requiredPlaceholders: FULL_RECOMMENDATION_REQUIRED_PLACEHOLDERS,
  });

  return { prompt: renderedPrompt, warnings };
};

export const generateFullModeRecommendation = async (
  input: GenerateFullModeRecommendationInput,
): Promise<FullModeRecommendationResult> => {
  const paragraphs = extractArticleParagraphs(input.article.content);

  if (paragraphs.length < 2) {
    const { introText, warnings } = await generateVideoIntroText(input);

    return {
      recommendedInsertionIndex: null,
      introText,
      warnings,
    };
  }

  const { prompt, warnings } = buildPrompt({
    title: input.article.title,
    tags: input.article.tags,
    paragraphs,
    video: input.video,
    language: input.options.language,
    aiPrompt: input.aiPrompt,
  });
  const aiGatewayResponse = await generateResult(prompt);
  const { recommendedInsertionIndex, introText } =
    parseFullRecommendationResponse(aiGatewayResponse, paragraphs.length);

  return {
    recommendedInsertionIndex,
    introText,
    warnings,
  };
};
