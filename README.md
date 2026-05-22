# Recommendations Intro Text

Small Node.js + TypeScript + Express service that generates editorial intro text for a video inside an article.

The service receives article data, asks the Related Videos API for the best video for that article URL, fetches video metadata from the public Video Metadata API, sends article and video context to Google Gemini, and returns an `introText` that can be placed next to the video.

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

- `GEMINI_API_KEY` is required.
- `GEMINI_MODEL` controls which Gemini model is used.
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

## Generate Intro Text

```bash
curl -X POST http://localhost:3000/intro-text \
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
    }
  }'
```

Response:

```json
{
  "videoId": "RfUte2WH",
  "introText": "..."
}
```

## Scripts

```bash
npm run dev
npm run typecheck
```
