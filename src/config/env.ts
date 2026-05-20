import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  VIDEO_METADATA_API_BASE_URL: z
    .string()
    .url()
    .default('https://video-metadata-api.prod.aller.cloud'),
  VIDEO_METADATA_DEFAULT_BRAND: z.string().min(1).default('dagbladet'),
  VIDEO_METADATA_DEFAULT_COUNTRY: z.string().min(1).default('no'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  REQUEST_BODY_LIMIT: z.string().min(1).default('2mb'),
});

export const env = envSchema.parse(process.env);
