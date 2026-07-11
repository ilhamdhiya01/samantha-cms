// src/services/post.service.ts
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { slugify } from "../lib/slugify.js";
import { HttpError } from "../middlewares/errorHandler.js";
import type { PostInput } from "../schemas/post.schema.js";

async function ensureUniqueSlug(
  base: string,
  ignoreId?: number,
): Promise<string> {
  let slug = base || "post";
  let n = 1;
  // Cap retries to avoid infinite loop
  while (n < 100) {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

export async function listPosts(params: {
  q?: string;
  status?: "draft" | "published";
  categoryId?: number;
  tagId?: number;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.PostWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { excerpt: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.categoryId) {
    where.categories = { some: { categoryId: params.categoryId } };
  }
  if (params.tagId) {
    where.tags = { some: { tagId: params.tagId } };
  }

  const [total, items] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        author: { select: { id: true, email: true, name: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        _count: { select: { sections: true } },
      },
    }),
  ]);

  return {
    items,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
    },
  };
}

export async function getPost(id: number) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { order: "asc" } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
      author: { select: { id: true, email: true, name: true } },
    },
  });
  if (!post) throw new HttpError(404, "NOT_FOUND", "Post tidak ditemukan");
  return post;
}

export async function createPost(authorId: number, input: PostInput) {
  const baseSlug = slugify(input.slug || input.title);
  const slug = await ensureUniqueSlug(baseSlug);

  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt ?? null,
        thumbnail: input.thumbnail ?? null,
        status: input.status,
        publishedAt: input.publishedAt
          ? new Date(input.publishedAt)
          : input.status === "published"
            ? new Date()
            : null,
        authorId,
        sections: {
          create: input.sections.map((s, idx) => ({
            type: s.type,
            order: s.order ?? idx,
            text: s.text ?? null,
            url: s.url ?? null,
            caption: s.caption ?? null,
            level: s.level ?? null,
            language: s.language ?? null,
          })),
        },
        categories: {
          create: input.categoryIds.map((cid) => ({ categoryId: cid })),
        },
        tags: {
          create: input.tagIds.map((tid) => ({ tagId: tid })),
        },
      },
      include: {
        sections: { orderBy: { order: "asc" } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    return post;
  });
}

export async function updatePost(id: number, input: PostInput) {
  const exists = await prisma.post.findUnique({ where: { id } });
  if (!exists) throw new HttpError(404, "NOT_FOUND", "Post tidak ditemukan");

  const baseSlug = slugify(input.slug || input.title);
  const slug = await ensureUniqueSlug(baseSlug, id);

  return prisma.$transaction(async (tx) => {
    // Replace sections atomically
    await tx.section.deleteMany({ where: { postId: id } });
    await tx.postCategory.deleteMany({ where: { postId: id } });
    await tx.postTag.deleteMany({ where: { postId: id } });

    const post = await tx.post.update({
      where: { id },
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt ?? null,
        thumbnail: input.thumbnail ?? null,
        status: input.status,
        publishedAt:
          input.publishedAt !== undefined
            ? input.publishedAt
              ? new Date(input.publishedAt)
              : null
            : input.status === "published" && !exists.publishedAt
              ? new Date()
              : undefined,
        sections: {
          create: input.sections.map((s, idx) => ({
            type: s.type,
            order: s.order ?? idx,
            text: s.text ?? null,
            url: s.url ?? null,
            caption: s.caption ?? null,
            level: s.level ?? null,
            language: s.language ?? null,
          })),
        },
        categories: {
          create: input.categoryIds.map((cid) => ({ categoryId: cid })),
        },
        tags: {
          create: input.tagIds.map((tid) => ({ tagId: tid })),
        },
      },
      include: {
        sections: { orderBy: { order: "asc" } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    return post;
  });
}

export async function deletePost(id: number) {
  try {
    await prisma.post.delete({ where: { id } });
  } catch {
    throw new HttpError(404, "NOT_FOUND", "Post tidak ditemukan");
  }
}

export interface ReorderItem {
  id: number;
  order: number;
}

function assertReorderItems(raw: unknown): ReorderItem[] {
  if (!Array.isArray(raw)) {
    throw new HttpError(400, "INVALID_PAYLOAD", "items harus berupa array");
  }
  if (raw.length === 0) {
    throw new HttpError(400, "INVALID_PAYLOAD", "items tidak boleh kosong");
  }
  const seen = new Set<number>();
  for (const r of raw) {
    if (typeof r !== "object" || r === null) {
      throw new HttpError(400, "INVALID_SECTIONS", "Setiap item harus objek");
    }
    const obj = r as Record<string, unknown>;
    // Strict whitelist: only `id` and `order` are accepted. Anything else rejects.
    const ALLOWED = new Set(["id", "order"]);
    for (const k of Object.keys(obj)) {
      if (!ALLOWED.has(k)) {
        throw new HttpError(
          400,
          "INVALID_SECTIONS",
          `Field '${k}' tidak diizinkan`,
        );
      }
    }
    if (
      typeof obj.id !== "number" ||
      !Number.isFinite(obj.id) ||
      obj.id <= 0 ||
      !Number.isInteger(obj.id)
    ) {
      throw new HttpError(400, "INVALID_SECTIONS", "id harus integer positif");
    }
    if (
      typeof obj.order !== "number" ||
      !Number.isFinite(obj.order) ||
      obj.order < 0 ||
      !Number.isInteger(obj.order)
    ) {
      throw new HttpError(400, "INVALID_SECTIONS", "order harus integer >= 0");
    }
    if (seen.has(obj.id)) {
      throw new HttpError(400, "INVALID_SECTIONS", `id ${obj.id} duplikat`);
    }
    seen.add(obj.id);
  }
  return raw as ReorderItem[];
}

export async function reorderSections(postId: number, rawItems: unknown) {
  const items = assertReorderItems(rawItems);
  // Validate all IDs belong to this post
  const ids = items.map((i) => i.id);
  const found = await prisma.section.findMany({
    where: { id: { in: ids }, postId },
    select: { id: true },
  });
  if (found.length !== ids.length) {
    throw new HttpError(
      400,
      "INVALID_SECTIONS",
      "Ada section ID yang tidak cocok",
    );
  }
  await prisma.$transaction(
    items.map((i) =>
      prisma.section.update({
        where: { id: i.id },
        data: { order: i.order }, // explicitly only `order` — type/postId/etc not touched
      }),
    ),
  );
  return prisma.section.findMany({
    where: { postId },
    orderBy: { order: "asc" },
  });
}
