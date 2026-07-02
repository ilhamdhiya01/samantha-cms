// src/schemas/taxonomy.schema.ts
import { z } from 'zod';

export const CategoryInputSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).optional(),
});

export const TagInputSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(60).optional(),
});

export const AttachCategorySchema = z.object({
  categoryId: z.number().int().positive(),
});

export const AttachTagSchema = z.object({
  tagId: z.number().int().positive(),
});
