import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'stage', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  VIDEO_METADATA_API_BASE_URL: z
    .string()
    .url()
    .default('https://video-metadata-api.prod.aller.cloud'),
  RELATED_VIDEOS_API_BASE_URL: z
    .string()
    .url()
    .default('https://dtnl.stage.medialaben.no/dtnl/recommendation-bff/api/v1'),
  VIDEO_METADATA_DEFAULT_BRAND: z.string().min(1).default('dagbladet'),
  VIDEO_METADATA_DEFAULT_COUNTRY: z.string().min(1).default('no'),
  REQUEST_BODY_LIMIT: z.string().min(1).default('2mb'),
  CF_AIG_TOKEN: z.string().min(1, 'CF_AIG_TOKEN is required'),
  AI_GATEWAY_BASE_URL: z
    .string()
    .url()
    .default(
      'https://gateway.ai.cloudflare.com/v1/f40c46d48669187fc6bb2c53761b7d6b/llm-gateway/compat',
    ),
  AI_GATEWAY_MODEL: z
    .string()
    .min(1)
    .default('google-vertex-ai/google/gemini-2.5-flash'),
});

export const env = envSchema.parse(process.env);
