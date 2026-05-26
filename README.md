# Article Video Recommendation Service

Small Node.js + TypeScript + Express service that returns a recommended video for an article and generates an editorial intro text for that video.

The service receives article data, asks the Related Videos API for the best video for the article URL, fetches video metadata from the public Video Metadata API, sends article and video context to Google Gemini, and returns both recommendation and intro.

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
    }
  }'
```

Response:

```json
{
  "recommendedVideo": {
    "id": "RfUte2WH"
  },
  "intro": {
    "text": "...",
    "language": "no"
  }
}
```

## Scripts

```bash
npm run dev
npm run typecheck
```
