// src/services/taxonomy.service.ts
import { prisma } from '../lib/prisma.js';
import { slugify } from '../lib/slugify.js';
import { HttpError } from '../middlewares/errorHandler.js';

async function ensureCategorySlug(base: string, ignoreId?: number) {
  let slug = base;
  let n = 1;
  while (n < 200) {
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (!exists || exists.id === ignoreId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

async function ensureTagSlug(base: string, ignoreId?: number) {
  let slug = base;
  let n = 1;
  while (n < 200) {
    const exists = await prisma.tag.findUnique({ where: { slug } });
    if (!exists || exists.id === ignoreId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

function parseId(raw: string, label: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'INVALID_ID', `${label} tidak valid`);
  return id;
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(input: { name: string; slug?: string }) {
  const slug = await ensureCategorySlug(slugify(input.slug || input.name));
  return prisma.category.create({ data: { name: input.name, slug } });
}

export async function updateCategory(
  id: number,
  input: { name?: string; slug?: string }
) {
  const exists = await prisma.category.findUnique({ where: { id } });
  if (!exists) throw new HttpError(404, 'NOT_FOUND', 'Category tidak ditemukan');
  const data: { name?: string; slug?: string } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = await ensureCategorySlug(slugify(input.slug), id);
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: number) {
  try {
    await prisma.category.delete({ where: { id } });
  } catch {
    throw new HttpError(404, 'NOT_FOUND', 'Category tidak ditemukan');
  }
}

export async function attachCategoryToPost(postIdRaw: string, categoryIdRaw: string) {
  const postId = parseId(postIdRaw, 'postId');
  const categoryId = parseId(categoryIdRaw, 'categoryId');
  const [post, category] = await Promise.all([
    prisma.post.findUnique({ where: { id: postId } }),
    prisma.category.findUnique({ where: { id: categoryId } }),
  ]);
  if (!post) throw new HttpError(404, 'NOT_FOUND', 'Post tidak ditemukan');
  if (!category) throw new HttpError(404, 'NOT_FOUND', 'Category tidak ditemukan');
  return prisma.postCategory.upsert({
    where: { postId_categoryId: { postId, categoryId } },
    update: {},
    create: { postId, categoryId },
  });
}

export async function detachCategoryFromPost(postIdRaw: string, categoryIdRaw: string) {
  const postId = parseId(postIdRaw, 'postId');
  const categoryId = parseId(categoryIdRaw, 'categoryId');
  await prisma.postCategory.deleteMany({ where: { postId, categoryId } });
}

// Tags
export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: 'asc' } });
}

export async function createTag(input: { name: string; slug?: string }) {
  const slug = await ensureTagSlug(slugify(input.slug || input.name));
  return prisma.tag.create({ data: { name: input.name, slug } });
}

export async function updateTag(
  id: number,
  input: { name?: string; slug?: string }
) {
  const exists = await prisma.tag.findUnique({ where: { id } });
  if (!exists) throw new HttpError(404, 'NOT_FOUND', 'Tag tidak ditemukan');
  const data: { name?: string; slug?: string } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = await ensureTagSlug(slugify(input.slug), id);
  return prisma.tag.update({ where: { id }, data });
}

export async function deleteTag(id: number) {
  try {
    await prisma.tag.delete({ where: { id } });
  } catch {
    throw new HttpError(404, 'NOT_FOUND', 'Tag tidak ditemukan');
  }
}

export async function attachTagToPost(postIdRaw: string, tagIdRaw: string) {
  const postId = parseId(postIdRaw, 'postId');
  const tagId = parseId(tagIdRaw, 'tagId');
  const [post, tag] = await Promise.all([
    prisma.post.findUnique({ where: { id: postId } }),
    prisma.tag.findUnique({ where: { id: tagId } }),
  ]);
  if (!post) throw new HttpError(404, 'NOT_FOUND', 'Post tidak ditemukan');
  if (!tag) throw new HttpError(404, 'NOT_FOUND', 'Tag tidak ditemukan');
  return prisma.postTag.upsert({
    where: { postId_tagId: { postId, tagId } },
    update: {},
    create: { postId, tagId },
  });
}

export async function detachTagFromPost(postIdRaw: string, tagIdRaw: string) {
  const postId = parseId(postIdRaw, 'postId');
  const tagId = parseId(tagIdRaw, 'tagId');
  await prisma.postTag.deleteMany({ where: { postId, tagId } });
}
