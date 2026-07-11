// src/controllers/post.controller.ts
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { fail, ok, created, noContent } from '../lib/apiResponse.js';
import { PostInputSchema, PostListQuerySchema, SectionReorderSchema } from '../schemas/post.schema.js';
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  reorderSections,
} from '../services/post.service.js';
import { HttpError } from '../middlewares/errorHandler.js';

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'INVALID_ID', 'ID tidak valid');
  return id;
}

export async function list(req: Request, res: Response) {
  const parsed = PostListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Query tidak valid', parsed.error.flatten());
  }
  const data = await listPosts(parsed.data);
  return ok(res, data.items, data.pagination);
}

export async function getById(req: Request, res: Response) {
  const post = await getPost(parseId(req.params.id));
  return ok(res, post);
}

export async function create(req: Request, res: Response) {
  if (!req.admin) throw new HttpError(401, 'UNAUTHORIZED', 'Tidak terautentikasi');
  const parsed = PostInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  }
  const post = await createPost(req.admin.id, parsed.data);
  return created(res, post);
}

export async function update(req: Request, res: Response) {
  const parsed = PostInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  }
  const post = await updatePost(parseId(req.params.id), parsed.data);
  return ok(res, post);
}

export async function remove(req: Request, res: Response) {
  await deletePost(parseId(req.params.id));
  return noContent(res);
}

export async function sectionsReorder(req: Request, res: Response) {
  const parsed = SectionReorderSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  }
  const items = await reorderSections(parseId(req.params.id), parsed.data.items);
  return ok(res, items);
}

// Nested: list sections for a post
export async function listSections(req: Request, res: Response) {
  const items = await prisma.section.findMany({
    where: { postId: parseId(req.params.id) },
    orderBy: { order: 'asc' },
  });
  return ok(res, items);
}
