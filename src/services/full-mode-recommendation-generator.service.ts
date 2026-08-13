import {
  DEFAULT_FULL_RECOMMENDATION_PROMPT_TEMPLATE,
  FULL_RECOMMENDATION_REQUIRED_PLACEHOLDERS,
  getFullRecommendationResponseInstructions,
} from '../config/prompt-templates';
import type { NormalizedVideo } from '../types/video-metadata-api';
import { extractArticleParagraphs } from '../utils/extractArticleParagraphs';
import type { GeneratedVideoIntro } from '../utils/parseGeneratedVideoIntros';
import { parseFullRecommendationResponse } from '../utils/parseFullRecommendationResponse';
import {
  type PromptTemplateWarning,
  renderPromptTemplate,
} from '../utils/prompt-template';
import { serializeVideosForPrompt } from '../utils/serializeVideosForPrompt';
import { truncateText } from '../utils/truncateText';
import { generateResult } from './ai-gateway.service';
import { generateVideoIntroTexts } from './intro-text-generator.service';

interface GenerateFullModeRecommendationInput {
  article: {
    title: string;
    content: string;
    tags: string[];
  };
  videos: NormalizedVideo[];
  options: {
    language: string;
  };
  aiPrompt?: string;
}

interface FullModeRecommendationResult {
  recommendedInsertionIndex: number | null;
  videoIntros: GeneratedVideoIntro[];
  warnings: PromptTemplateWarning[];
}

const buildPrompt = (input: {
  title: string;
  tags: string[];
  paragraphs: string[];
  videos: NormalizedVideo[];
  language: string;
  aiPrompt?: string;
}): { prompt: string; warnings: PromptTemplateWarning[] } => {
  const articleParagraphs = truncateText(
    input.paragraphs
      .map(
        (paragraph, index) => `${index + 1}. ${truncateText(paragraph, 1200)}`,
      )
      .join('\n'),
    20000,
  );
  const videos = serializeVideosForPrompt(input.videos);
  const videoIds = input.videos.map(({ displayId }) => displayId);

  const { renderedPrompt, warnings } = renderPromptTemplate({
    template: input.aiPrompt,
    fallbackTemplate: DEFAULT_FULL_RECOMMENDATION_PROMPT_TEMPLATE,
    context: {
      responseLanguage: input.language,
      articleTitle: input.title,
      articleTags: input.tags.join(', ') || 'No tags',
      articleParagraphs,
      videos,
    },
    requiredPlaceholders: FULL_RECOMMENDATION_REQUIRED_PLACEHOLDERS,
  });

  return {
    prompt: `${renderedPrompt}\n\n${getFullRecommendationResponseInstructions(videoIds)}`,
    warnings,
  };
};

export const generateFullModeRecommendation = async (
  input: GenerateFullModeRecommendationInput,
): Promise<FullModeRecommendationResult> => {
  const paragraphs = extractArticleParagraphs(input.article.content);

  if (paragraphs.length < 2) {
    const { videoIntros, warnings } = await generateVideoIntroTexts(input);

    return {
      recommendedInsertionIndex: null,
      videoIntros,
      warnings,
    };
  }

  const { prompt, warnings } = buildPrompt({
    title: input.article.title,
    tags: input.article.tags,
    paragraphs,
    videos: input.videos,
    language: input.options.language,
    aiPrompt: input.aiPrompt,
  });
  const aiGatewayResponse = await generateResult(prompt);
  const { recommendedInsertionIndex, videoIntros } =
    parseFullRecommendationResponse(
      aiGatewayResponse,
      paragraphs.length,
      input.videos.map(({ displayId }) => displayId),
    );

  return {
    recommendedInsertionIndex,
    videoIntros,
    warnings,
  };
};
