# Article Video Recommendation Service

Small Node.js + TypeScript + Express service that recommends videos, generates a separate editorial intro text for each video, and chooses one shared insertion position for an article.

The service receives article data and generates the requested combination of video recommendations, editorial intros, and insertion position.

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
      "videoLimit": 3,
      "country": "no",
      "brand": "dagbladet"
    },
    "aiPrompt": "Language: ${responseLanguage}\nArticle title: ${articleTitle}\nArticle tags: ${articleTags}\nParagraphs:\n${articleParagraphs}\nVideos:\n${videos}\nChoose one insertion position that works for every video and write a separate intro text for each video."
  }'
```

Response:

```json
{
  "videos": [
    {
      "id": "RfUte2WH",
      "title": "Recommended video title",
      "tags": "fashion, beauty",
      "duration": 30.162,
      "posterUrl": "https://example.com/video-poster.jpg",
      "introText": "An intro written specifically for this video."
    },
    {
      "id": "AbCd1234",
      "title": "Another recommended video",
      "tags": "fashion, trends",
      "duration": 42.5,
      "posterUrl": "https://example.com/another-video-poster.jpg",
      "introText": "A different intro written specifically for this video."
    }
  ],
  "recommendedInsertionIndex": 1,
  "warnings": []
}
```

The optional `options.videoLimit` property is an integer from `1` to `5` and defaults to `1`. It limits how many unique video recommendations are requested and returned.

The `options.country` and `options.brand` properties are required. `country` supports `no`, `se`, `dk`, and `fi`, and the brand must be supported in the selected country. Unsupported values return `400` with either `COUNTRY_NOT_SUPPORTED` or `BRAND_NOT_SUPPORTED`.

The optional `options.language` property overrides the language used for generated video intro texts. When it is omitted, the service uses the default language for the required `options.country`: Norwegian Bokmål, Swedish, Danish, or Finnish.

Supported brand and country combinations:

- `no`: `borsen`, `dagbladet`, `dinside`, `elbil24`, `kk`, `seher`, `sol`
- `se`: `allas`, `elle`, `femina`, `hant`, `mabra`, `motherhood`, `recept`, `residence`, `svenskdam`
- `dk`: `billedbladet`, `familiejournal`, `femina`, `isabellas`, `seoghoer`, `spisbedre`, `udeoghjemme`
- `fi`: `femina`, `seiska`

The optional `mode` property defaults to `full` and controls which fields are generated:

- `full`: fetches metadata for every recommended video, then uses one AI request to choose one shared `recommendedInsertionIndex` and add a separate `introText` to every item in `videos`.
- `position-only`: returns `recommendedInsertionIndex` and `warnings`.
- `videos-with-intro`: fetches metadata for every recommended video, then uses one AI request to add a separate `introText` to every item in `videos`.
- `videos-only`: returns `videos` and an empty `warnings` array.

Each mode validates `aiPrompt` against the placeholders required for that operation and falls back to its own built-in prompt when the supplied template is incompatible, adding the corresponding entries to `warnings`.

For modes that generate intro text, all requested video metadata is fetched in parallel. Recommendations without exact metadata are skipped, so the response can contain fewer videos than `options.videoLimit`. If metadata is unavailable for every recommendation, the service returns `404` with the `NO_AVAILABLE_VIDEO_RECOMMENDATIONS` code. Other Video Metadata API failures still fail the request. AI results are matched to recommendations by video `id`, not by array position.

## AI Prompts

- AI prompts are plain strings, not executable JavaScript.
- Supported placeholders use simple names, for example `${articleTitle}` and `${articleParagraphs}`.
- `full` requires `${responseLanguage}`, `${articleTitle}`, `${articleTags}`, `${articleParagraphs}`, and `${videos}`.
- `videos-with-intro` requires `${responseLanguage}`, `${articleTitle}`, `${articleTags}`, `${articleContent}`, and `${videos}`.
- `${videos}` contains a JSON array with each video's `id`, title, description, tags, and truncated transcript.
- Placeholders are resolved in runtime context by the service (no `eval` / `new Function`).
- Unknown placeholders are rendered as empty strings and returned as warnings.
- If an AI prompt is missing or required placeholders are missing, the service falls back to built-in defaults and returns warnings.
- The service always appends the required JSON response contract after the rendered prompt. Custom prompts control editorial instructions but cannot replace the response shape.
- Warning codes: `PROMPT_TEMPLATE_MISSING`, `PROMPT_TEMPLATE_MISSING_REQUIRED_PLACEHOLDERS`, `PROMPT_TEMPLATE_UNKNOWN_PLACEHOLDER`.

## Scripts

```bash
npm run dev
npm run typecheck
npm run test
```
