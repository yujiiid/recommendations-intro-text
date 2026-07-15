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
    .enum(['full', 'position-only', 'video-with-intro', 'video-only'])
    .default('full'),
  article: articleSchema,
  options: z
    .object({
      language: z.string().min(1).default('no'),
    })
    .default({ language: 'no' }),
  aiPrompt: promptSchema,
});

export type recommendationRequest = z.infer<
  typeof recommendationRequestSchema
>;
