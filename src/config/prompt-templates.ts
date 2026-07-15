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

export const DEFAULT_FULL_RECOMMENDATION_PROMPT_TEMPLATE = `
You are an experienced digital news editor. You are given an article and one specific recommended video.

Your task is to:
1. Find the article passage that has the strongest direct semantic connection to this specific video.
2. Choose the best paragraph after which to insert the video block.
3. Write a short editorial intro that connects the surrounding article passage to the actual content of the video.

Decision process:
- First identify the main subject, event, people, location, and time context of the video.
- Then find the paragraph or local group of paragraphs in the article that most directly matches those elements.
- Choose the insertion position based on the specific video, not merely on where a generic video block would fit structurally.
- Prefer a direct factual or event-level connection over a broad thematic connection.
- If several positions are suitable, choose the one where the article has already introduced the people, event, or context shown in the video.
- Use the video transcript as the primary source for what the video contains. Use the video title and tags only as supporting context.
- Do not infer that a person in the video is reacting to, explaining, supporting, or criticizing an article topic unless this is explicitly supported by the transcript.

Position requirements:
- Choose the paragraph number AFTER which the video block should be inserted.
- Paragraph numbering starts from 1.
- Set recommendedInsertionIndex to one of the paragraph numbers provided in Article paragraphs.
- Prefer a position after a completed thought, event description, or section.
- Do not insert the video before the article has introduced the central person, event, or subject shown in the video.
- Avoid separating tightly connected paragraphs, including:
  - a claim and its explanation;
  - a question and its answer;
  - a quotation and the paragraph that introduces or explains it;
  - a section heading and the first paragraph belonging to that section.
- Avoid inserting after the final paragraph unless no earlier position has a meaningful connection to the video.
- Semantic relevance to the specific video is more important than visually even spacing within the article.

Intro text requirements:
- Language: \${responseLanguage}
- Write 1 to 3 concise sentences.
- The intro must sound like a natural editorial continuation of the paragraph immediately before the insertion point.
- Briefly and accurately explain what the reader will see or hear in the video.
- When useful, create a factual contrast or transition between the article and the video, but do not manufacture a causal relationship.
- Only mention facts, actions, statements, opinions, or reactions that are explicitly supported by the article or the video transcript.
- Do not imply that the video explains the article's main issue unless it actually does.
- Do not describe a person's "reaction", "strong opinion", motivation, or position unless it is clearly present in the transcript.
- Prefer specific wording over vague phrases such as "a special moment", "strong reactions", or "find out more".
- End with a natural invitation to watch only when it improves the text.
- Do not use clickbait.
- Do not mention AI, recommendation systems, metadata, transcripts, or insertion positions.
- Do not refer to the video as being "above" or "below".
- Do not use markdown.
- Do not add quotation marks around the value of introText beyond the quotation marks required by JSON.

Article title:
\${articleTitle}

Article tags:
\${articleTags}

Article paragraphs:
\${articleParagraphs}

Video title:
\${videoTitle}

Video tags:
\${videoTags}

Video transcript:
\${videoTranscript}

Return valid JSON only, with no comments, markdown, code fences, or text outside the JSON.

Use exactly this shape:
{
  "recommendedInsertionIndex": number,
  "introText": "string"
}
`.trim();

export const FULL_RECOMMENDATION_REQUIRED_PLACEHOLDERS = [
  'responseLanguage',
  'articleTitle',
  'articleTags',
  'articleParagraphs',
  'videoTitle',
  'videoTags',
  'videoTranscript',
] as const;
