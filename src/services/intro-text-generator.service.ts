import type { NormalizedVideo } from '../types/video-metadata-api';
import { truncateText } from '../utils/truncateText';
import { generateText } from './gemini.service';

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
}

const cleanArticleVideoIntro = (text: string) => {
  return text
    .trim()
    .replace(/^```(?:text)?/i, '')
    .replace(/```$/i, '')
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .trim();
};

const buildPrompt = (input: GenerateArticleVideoIntroInput) => {
  const articleContent = truncateText(input.article.content, 12000);
  const videoTranscript = truncateText(input.video.transcript, 8000);

  return `
You are an experienced editor.

Write a short editorial intro text that can be inserted in the middle of an article next to a video.

Requirements:
- Language: ${input.options.language}
- Maximum 3-4 sentences.
- The text must fit both the article and the video.
- Gently suggest that the reader watches the video while reading the article.
- Briefly describe what the video is about.
- Do not use clickbait.
- Do not invent facts that are not present in the article or video.
- Do not mention AI.
- Do not use markdown.
- Do not wrap the answer in quotes.
- Return only the final intro text.

Article:
Title: ${input.article.title}
Tags: ${input.article.tags.join(', ') || 'No tags'}
Content:
${articleContent}

Video:
Title: ${input.video.title}
Description: ${input.video.description}
Tags: ${input.video.tags.join(', ') || 'No tags'}
Transcript:
${videoTranscript}
`.trim();
};

export const generateVideoIntroText = async (
  input: GenerateArticleVideoIntroInput,
): Promise<string> => {
  const prompt = buildPrompt(input);
  const introText = await generateText(prompt);

  return cleanArticleVideoIntro(introText);
};
