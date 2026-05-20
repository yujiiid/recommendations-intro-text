import { z } from 'zod';

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'article.title is required'),
  description: z.string().min(1, 'article.description is required'),
  content: z.string().min(1, 'article.content is required'),
  tags: z.array(z.string()).default([]),
});

export const introRequestSchema = z.object({
  article: articleSchema,
  video: z.object({
    id: z.string().min(1, 'video.id is required'),
  }),
  options: z
    .object({
      language: z.string().min(1).default('no'),
    })
    .default({ language: 'no' }),
});

export type IntroRequest = z.infer<typeof introRequestSchema>;
