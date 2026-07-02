// src/schemas/post.schema.ts
import { z } from 'zod';

export const SectionInputSchema = z.object({
  id: z.number().int().positive().optional(),
  type: z.enum(['heading', 'paragraph', 'image', 'quote', 'code', 'divider']),
  order: z.number().int().nonnegative(),
  text: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),
  caption: z.string().optional().nullable(),
  level: z.number().int().min(1).max(6).optional().nullable(),
  language: z.string().optional().nullable(),
});

export const PostInputSchema = z.object({
  title: z.string().min(1, 'Judul wajib').max(200),
  slug: z.string().min(1).max(220).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.string().datetime().optional().nullable(),
  sections: z.array(SectionInputSchema).default([]),
  categoryIds: z.array(z.number().int().positive()).default([]),
  tagIds: z.array(z.number().int().positive()).default([]),
});

export const PostListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  tagId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const SectionReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        order: z.number().int().nonnegative(),
      })
    )
    .min(1),
});

export type PostInput = z.infer<typeof PostInputSchema>;
export type SectionInput = z.infer<typeof SectionInputSchema>;
