import { z } from 'zod';

const articleSchema = z.object({
  id: z.string().optional(),
  url: z.string().url('article.url must be a valid URL'),
  title: z.string().min(1, 'article.title is required'),
  content: z.string().min(1, 'article.content is required'),
  tags: z.array(z.string()).default([]),
});

export const articleVideoRecommendationRequestSchema = z.object({
  article: articleSchema,
  options: z
    .object({
      language: z.string().min(1).default('no'),
    })
    .default({ language: 'no' }),
});

export type ArticleVideoRecommendationRequest = z.infer<
  typeof articleVideoRecommendationRequestSchema
>;

export const videoPositionRequestSchema = z.object({
  title: z.string().min(1, 'title is required'),
  content: z.string().min(1, 'content is required'),
  tags: z.array(z.string()).default([]),
});

export type VideoPositionRequest = z.infer<typeof videoPositionRequestSchema>;
