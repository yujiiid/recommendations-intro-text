import { z } from 'zod';

const promptSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().optional());

const articleSchema = z.object({
  title: z.string().min(1, 'article.title is required'),
  content: z.string().min(1, 'article.content is required'),
  tags: z.array(z.string()).default([]),
});

export const recommendationRequestSchema = z.object({
  mode: z
    .enum(['full', 'position-only', 'videos-with-intro', 'videos-only'])
    .default('full'),
  article: articleSchema,
  options: z.object({
    language: z.string().trim().min(1).optional(),
    videoLimit: z.number().int().positive().max(5).default(1),
    country: z.string().trim().min(1, 'options.country is required'),
    brand: z.string().trim().min(1, 'options.brand is required'),
  }),
  aiPrompt: promptSchema,
});

export type recommendationRequest = z.infer<typeof recommendationRequestSchema>;
