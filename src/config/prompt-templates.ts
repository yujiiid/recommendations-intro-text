export const DEFAULT_INTRO_PROMPT_TEMPLATE = `
You are an experienced editor.

Write a short editorial intro text that can be inserted in the middle of an article next to a video.

Requirements:
- Language: \${responseLanguage}
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
Title: \${articleTitle}
Tags: \${articleTags}
Content:
\${articleContent}

Video:
Title: \${videoTitle}
Description: \${videoDescription}
Tags: \${videoTags}
Transcript:
\${videoTranscript}
`.trim();

export const INTRO_REQUIRED_PLACEHOLDERS = [
  'responseLanguage',
  'articleTitle',
  'articleTags',
  'articleContent',
  'videoTitle',
  'videoDescription',
  'videoTags',
  'videoTranscript',
] as const;

export const DEFAULT_VIDEO_POSITION_PROMPT_TEMPLATE = `
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
\${articleTitle}

Article tags:
\${articleTags}

Paragraphs:
\${articleParagraphs}

Return exactly this JSON shape:
{
  "recommendedInsertionIndex": number
}
`.trim();

export const VIDEO_POSITION_REQUIRED_PLACEHOLDERS = [
  'articleTitle',
  'articleTags',
  'articleParagraphs',
] as const;
