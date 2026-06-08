# Article Video Recommendation Service

Small Node.js + TypeScript + Express service that returns a recommended video for an article and generates an editorial intro text for that video.

The service receives article data, asks the Related Videos API for the best video for the article URL, fetches video metadata from the public Video Metadata API, sends article and video context to Cloudflare AI Gateway through the OpenAI client, and returns both recommendation and intro.

## Install

```bash
npm install
```

## Environment

Create a local env file:

```bash
cp .env.example .env
```

Fill in the values you need:

- `CF_AIG_TOKEN` is required and must not be committed.
- `AI_GATEWAY_BASE_URL` points the OpenAI client to Cloudflare AI Gateway.
- `AI_GATEWAY_MODEL` controls which AI Gateway model is used.
- `RELATED_VIDEOS_API_BASE_URL` controls where related videos are fetched from.
- `VIDEO_METADATA_DEFAULT_BRAND` controls the video API brand query param.
- `VIDEO_METADATA_DEFAULT_COUNTRY` controls the video API country query param.

## Run

```bash
npm run dev
```

## Health Check

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "ok": true
}
```

## Create Article Video Recommendation

```bash
curl -X POST http://localhost:3000/article-video-recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "url": "https://www.femina.se/intervju/barbro-wiklund-har-hjalpt-utsatta-kvinnor-i-37-ar/11343787",
      "title": "Article title",
      "content": "Full article text",
      "tags": ["fashion", "beauty"]
    },
    "options": {
      "language": "no"
    },
    "aiPrompt": "Language: ${responseLanguage}\nTitle: ${articleTitle}\nTags: ${articleTags}\nContent: ${articleContent}\nVideo title: ${videoTitle}\nVideo description: ${videoDescription}\nVideo tags: ${videoTags}\nVideo transcript: ${videoTranscript}"
  }'
```

Response:

```json
{
  "videoId": "RfUte2WH",
  "introText": "...",
  "warnings": []
}
```

## Recommend Video Position

```bash
curl -X POST http://localhost:3000/video-position \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Article title",
    "content": "<p>Paragraph one...</p><p>Paragraph two...</p>",
    "tags": ["fashion", "beauty"],
    "aiPrompt": "Article title:\n${articleTitle}\n\nArticle tags:\n${articleTags}\n\nParagraphs:\n${articleParagraphs}"
  }'
```

Response:

```json
{
  "recommendedInsertionIndex": 3,
  "warnings": []
}
```

## AI Prompts

- AI prompts are plain strings, not executable JavaScript.
- Supported placeholders use simple names, for example `${articleTitle}` and `${articleParagraphs}`.
- Placeholders are resolved in runtime context by the service (no `eval` / `new Function`).
- Unknown placeholders are rendered as empty strings and returned as warnings.
- If an AI prompt is missing or required placeholders are missing, the service falls back to built-in defaults and returns warnings.
- Warning codes: `PROMPT_TEMPLATE_MISSING`, `PROMPT_TEMPLATE_MISSING_REQUIRED_PLACEHOLDERS`, `PROMPT_TEMPLATE_UNKNOWN_PLACEHOLDER`.

## Scripts

```bash
npm run dev
npm run typecheck
npm run test
```
