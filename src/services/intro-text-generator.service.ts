import type { NormalizedVideo } from '../types/video-metadata-api';
import { cleanVideoIntroText } from '../utils/cleanVideoIntroText';
import { truncateText } from '../utils/truncateText';
import {
  type PromptTemplateWarning,
  renderPromptTemplate,
} from '../utils/prompt-template';
import {
  DEFAULT_INTRO_PROMPT_TEMPLATE,
  INTRO_REQUIRED_PLACEHOLDERS,
} from '../config/prompt-templates';
import { generateResult } from './ai-gateway.service';

interface GenerateArticleVideoIntroInput {
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

interface GenerateArticleVideoIntroResult {
  introText: string;
  warnings: PromptTemplateWarning[];
}

const buildPrompt = (
  input: GenerateArticleVideoIntroInput,
): { prompt: string; warnings: PromptTemplateWarning[] } => {
  const articleContent = truncateText(input.article.content, 12000);
  const videoTranscript = truncateText(input.video.transcript, 8000);

  const { renderedPrompt, warnings } = renderPromptTemplate({
    template: input.aiPrompt,
    fallbackTemplate: DEFAULT_INTRO_PROMPT_TEMPLATE,
    context: {
      responseLanguage: input.options.language,
      articleTitle: input.article.title,
      articleTags: input.article.tags.join(', ') || 'No tags',
      articleContent,
      videoTitle: input.video.title,
      videoDescription: input.video.description,
      videoTags: input.video.tags.join(', ') || 'No tags',
      videoTranscript,
    },
    requiredPlaceholders: INTRO_REQUIRED_PLACEHOLDERS,
  });

  return { prompt: renderedPrompt, warnings };
};

export const generateVideoIntroText = async (
  input: GenerateArticleVideoIntroInput,
): Promise<GenerateArticleVideoIntroResult> => {
  const { prompt, warnings } = buildPrompt(input);
  const introText = await generateResult(prompt);

  return {
    introText: cleanVideoIntroText(introText),
    warnings,
  };
};
