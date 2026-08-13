import type { NormalizedVideo } from '../types/video-metadata-api';
import type { GeneratedVideoIntro } from '../utils/parseGeneratedVideoIntros';
import { parseAndValidateVideoIntrosResponse } from '../utils/parseAndValidateVideoIntrosResponse';
import { serializeVideosForPrompt } from '../utils/serializeVideosForPrompt';
import { truncateText } from '../utils/truncateText';
import {
  type PromptTemplateWarning,
  renderPromptTemplate,
} from '../utils/prompt-template';
import {
  DEFAULT_INTRO_PROMPT_TEMPLATE,
  getVideoIntrosResponseInstructions,
  INTRO_REQUIRED_PLACEHOLDERS,
} from '../config/prompt-templates';
import { generateResult } from './ai-gateway.service';

interface GenerateArticleVideoIntrosInput {
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

interface GenerateArticleVideoIntrosResult {
  videoIntros: GeneratedVideoIntro[];
  warnings: PromptTemplateWarning[];
}

const buildPrompt = (
  input: GenerateArticleVideoIntrosInput,
): { prompt: string; warnings: PromptTemplateWarning[] } => {
  const articleContent = truncateText(input.article.content, 12000);
  const videos = serializeVideosForPrompt(input.videos);
  const videoIds = input.videos.map(({ displayId }) => displayId);

  const { renderedPrompt, warnings } = renderPromptTemplate({
    template: input.aiPrompt,
    fallbackTemplate: DEFAULT_INTRO_PROMPT_TEMPLATE,
    context: {
      responseLanguage: input.options.language,
      articleTitle: input.article.title,
      articleTags: input.article.tags.join(', ') || 'No tags',
      articleContent,
      videos,
    },
    requiredPlaceholders: INTRO_REQUIRED_PLACEHOLDERS,
  });

  return {
    prompt: `${renderedPrompt}\n\n${getVideoIntrosResponseInstructions(videoIds)}`,
    warnings,
  };
};

export const generateVideoIntroTexts = async (
  input: GenerateArticleVideoIntrosInput,
): Promise<GenerateArticleVideoIntrosResult> => {
  const { prompt, warnings } = buildPrompt(input);
  const aiGatewayResponse = await generateResult(prompt);

  return {
    videoIntros: parseAndValidateVideoIntrosResponse(
      aiGatewayResponse,
      input.videos.map(({ displayId }) => displayId),
    ),
    warnings,
  };
};
