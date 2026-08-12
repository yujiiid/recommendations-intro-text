# Article Video Recommendation Service

Small Node.js + TypeScript + Express service that recommends a video, generates an editorial intro text, and chooses an insertion position for an article.

The service receives article data and generates the requested combination of video recommendation, editorial intro, and insertion position.

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
- `VIDEO_RECOMMENDATIONS_API_URL` controls where video recommendations are fetched from.
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
curl -X POST http://localhost:3000/article-video-recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "full",
    "article": {
      "title": "Article title",
      "content": "<p>Paragraph one...</p><p>Paragraph two...</p>",
      "tags": ["fashion", "beauty"]
    },
    "options": {
      "language": "no"
    },
    "aiPrompt": "Language: ${responseLanguage}\nArticle title: ${articleTitle}\nArticle tags: ${articleTags}\nParagraphs:\n${articleParagraphs}\nVideo title: ${videoTitle}\nVideo tags: ${videoTags}\nTranscript:\n${videoTranscript}\nChoose the insertion index and write the intro. Return JSON with recommendedInsertionIndex and introText."
  }'
```

Response:

```json
{
  "video": {
    "id": "RfUte2WH",
    "title": "Recommended video title",
    "tags": "fashion, beauty",
    "duration": 30.162,
    "posterUrl": "https://example.com/video-poster.jpg"
  },
  "introText": "...",
  "recommendedInsertionIndex": 1,
  "warnings": []
}
```

The optional `mode` property defaults to `full` and controls which fields are generated:

- `full`: fetches the recommended video and its metadata, then uses one AI request to return `video`, `introText`, `recommendedInsertionIndex`, and `warnings`.
- `position-only`: returns `recommendedInsertionIndex` and `warnings`.
- `video-with-intro`: returns `video`, `introText`, and `warnings`.
- `video-only`: returns `video` and an empty `warnings` array.

Each mode validates `aiPrompt` against the placeholders required for that operation and falls back to its own built-in prompt when the supplied template is incompatible, adding the corresponding entries to `warnings`.

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
