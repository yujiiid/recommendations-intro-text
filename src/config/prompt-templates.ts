export const DEFAULT_INTRO_PROMPT_TEMPLATE = `
You are an experienced editor.

Write a separate short editorial intro text for every supplied video. Each intro will be displayed with its corresponding video inside the same article.

Requirements:
- Language: \${responseLanguage}
- Write 1 to 3 concise sentences per video.
- Each intro must fit both the article and only its corresponding video.
- Gently suggest that the reader watches the video while reading the article.
- Briefly describe what the video is about.
- Analyze every video independently.
- Use the transcript of the corresponding video as the primary source and its title, description, and tags only as supporting context.
- Never mix people, facts, events, statements, or reactions between videos.
- Do not use clickbait.
- Do not invent facts that are not present in the article or the corresponding video.
- Do not mention AI.
- Do not use markdown.

Article:
Title: \${articleTitle}
Tags: \${articleTags}
Content:
\${articleContent}

Videos (JSON):
\${videos}
`.trim();

export const INTRO_REQUIRED_PLACEHOLDERS = [
  'responseLanguage',
  'articleTitle',
  'articleTags',
  'articleContent',
  'videos',
] as const;

const formatExpectedVideoIds = (videoIds: string[]): string => {
  return JSON.stringify(videoIds);
};

export const getVideoIntrosResponseInstructions = (
  videoIds: string[],
): string =>
  `
Return valid JSON only, with no comments, markdown, code fences, or text outside the JSON.

The expected video IDs are: ${formatExpectedVideoIds(videoIds)}

Response requirements:
- Return exactly one object for every expected video ID.
- Copy every ID exactly. Do not omit, duplicate, modify, reorder, or invent IDs.
- Each introText must describe only the video with the same ID.

Use exactly this shape:
{
  "videos": [
    {
      "id": "exact-video-id",
      "introText": "string"
    }
  ]
}
`.trim();

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

export const DEFAULT_FULL_RECOMMENDATION_PROMPT_TEMPLATE = `
You are an experienced digital news editor. You are given an article and multiple recommended videos that will share one insertion position.

Your task is to:
1. Choose one paragraph after which the video recommendation block can be inserted regardless of which supplied video is displayed.
2. Write a separate editorial intro for every video. Every intro must connect the same selected article position to only its corresponding video.

Decision process:
- Analyze every video independently and identify its main subject, event, people, location, and time context.
- Find a completed article passage after which all of the video-specific intros can read naturally.
- Do not optimize the insertion position only for the first or highest-ranked video.
- Prefer a position with a meaningful connection shared by the videos and the article.
- If no passage has a strong direct connection to every video, choose a neutral completed-thought break after the article has introduced its central subject.
- For each intro, use only the matching video's data. Use its transcript as the primary source and its title, description, and tags only as supporting context.
- Never mix people, facts, events, statements, opinions, or reactions between videos.
- Do not infer that a person in a video is reacting to, explaining, supporting, or criticizing an article topic unless this is explicitly supported by that video's transcript.

Position requirements:
- Choose the paragraph number AFTER which the video block should be inserted.
- Paragraph numbering starts from 1.
- Set recommendedInsertionIndex to one of the paragraph numbers provided in Article paragraphs.
- Prefer a position after a completed thought, event description, or section.
- Every generated intro must sound natural immediately after the selected paragraph.
- Avoid separating tightly connected paragraphs, including:
  - a claim and its explanation;
  - a question and its answer;
  - a quotation and the paragraph that introduces or explains it;
  - a section heading and the first paragraph belonging to that section.
- Avoid inserting after the final paragraph unless no earlier position works for all videos.

Intro text requirements:
- Language: \${responseLanguage}
- Write 1 to 3 concise sentences for each video.
- The intro must sound like a natural editorial continuation of the paragraph immediately before the insertion point.
- Briefly and accurately explain what the reader will see or hear in the video.
- When useful, create a factual contrast or transition between the article and the video, but do not manufacture a causal relationship.
- Only mention facts, actions, statements, opinions, or reactions that are explicitly supported by the article or the corresponding video transcript.
- Do not imply that the video explains the article's main issue unless it actually does.
- Do not describe a person's "reaction", "strong opinion", motivation, or position unless it is clearly present in the transcript.
- Prefer specific wording over vague phrases such as "a special moment", "strong reactions", or "find out more".
- End with a natural invitation to watch only when it improves the text.
- Do not use clickbait.
- Do not mention AI, recommendation systems, metadata, transcripts, or insertion positions.
- Do not refer to the video as being "above" or "below".
- Do not use markdown.

Article title:
\${articleTitle}

Article tags:
\${articleTags}

Article paragraphs:
\${articleParagraphs}

Videos (JSON):
\${videos}
`.trim();

export const FULL_RECOMMENDATION_REQUIRED_PLACEHOLDERS = [
  'responseLanguage',
  'articleTitle',
  'articleTags',
  'articleParagraphs',
  'videos',
] as const;

export const getFullRecommendationResponseInstructions = (
  videoIds: string[],
): string =>
  `
Return valid JSON only, with no comments, markdown, code fences, or text outside the JSON.

The expected video IDs are: ${formatExpectedVideoIds(videoIds)}

Response requirements:
- Return exactly one recommendedInsertionIndex for the entire video block.
- Return exactly one object for every expected video ID.
- Copy every ID exactly. Do not omit, duplicate, modify, reorder, or invent IDs.
- Each introText must describe only the video with the same ID and must fit the one shared insertion position.

Use exactly this shape:
{
  "recommendedInsertionIndex": number,
  "videos": [
    {
      "id": "exact-video-id",
      "introText": "string"
    }
  ]
}
`.trim();
