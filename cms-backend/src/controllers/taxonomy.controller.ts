// src/controllers/taxonomy.controller.ts
import type { Request, Response } from 'express';
import { fail, ok, created, noContent } from '../lib/apiResponse.js';
import { CategoryInputSchema, TagInputSchema } from '../schemas/taxonomy.schema.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  attachCategoryToPost,
  detachCategoryFromPost,
  listTags,
  createTag,
  updateTag,
  deleteTag,
  attachTagToPost,
  detachTagFromPost,
} from '../services/taxonomy.service.js';
import { HttpError } from '../middlewares/errorHandler.js';

function parseIdParam(req: Request, key: string): number {
  const id = Number(req.params[key]);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'INVALID_ID', `${key} tidak valid`);
  return id;
}

export async function listCategoriesHandler(_req: Request, res: Response) {
  return ok(res, await listCategories());
}

export async function createCategoryHandler(req: Request, res: Response) {
  const parsed = CategoryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  }
  return created(res, await createCategory(parsed.data));
}

export async function updateCategoryHandler(req: Request, res: Response) {
  const parsed = CategoryInputSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  }
  return ok(res, await updateCategory(parseIdParam(req, 'id'), parsed.data));
}

export async function deleteCategoryHandler(req: Request, res: Response) {
  await deleteCategory(parseIdParam(req, 'id'));
  return noContent(res);
}

export async function attachCategoryHandler(req: Request, res: Response) {
  return ok(res, await attachCategoryToPost(req.params.postId, req.params.categoryId));
}

export async function detachCategoryHandler(req: Request, res: Response) {
  await detachCategoryFromPost(req.params.postId, req.params.categoryId);
  return noContent(res);
}

export async function listTagsHandler(_req: Request, res: Response) {
  return ok(res, await listTags());
}

export async function createTagHandler(req: Request, res: Response) {
  const parsed = TagInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  }
  return created(res, await createTag(parsed.data));
}

export async function updateTagHandler(req: Request, res: Response) {
  const parsed = TagInputSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  }
  return ok(res, await updateTag(parseIdParam(req, 'id'), parsed.data));
}

export async function deleteTagHandler(req: Request, res: Response) {
  await deleteTag(parseIdParam(req, 'id'));
  return noContent(res);
}

export async function attachTagHandler(req: Request, res: Response) {
  return ok(res, await attachTagToPost(req.params.postId, req.params.tagId));
}

export async function detachTagHandler(req: Request, res: Response) {
  await detachTagFromPost(req.params.postId, req.params.tagId);
  return noContent(res);
}
