import { apiClient, unwrap } from "./client";
import { type ImageItem } from "./content";

export interface Section {
  id?: number;
  type:
    | "heading"
    | "paragraph"
    | "image"
    | "image_group"
    | "quote"
    | "code"
    | "divider";
  order: number;
  text?: string | null;
  url?: string | null;
  caption?: string | null;
  level?: number | null;
  language?: string | null;
  images?: ImageItem[] | null;
  children?: Section[] | null;
}
export interface PostItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  thumbnail?: string | null;
  status: "draft" | "published";
  publishedAt?: string | null;
  updatedAt: string;
  author?: { id: number; email: string; name?: string | null };
  categories?: { category: { id: number; name: string; slug: string } }[];
  tags?: { tag: { id: number; name: string; slug: string } }[];
  _count?: { sections: number };
}
export interface PostDetail extends PostItem {
  sections: Section[];
}
export interface PostInput {
  title: string;
  slug?: string;
  excerpt?: string | null;
  thumbnail?: string | null;
  status: "draft" | "published";
  publishedAt?: string | null;
  sections: Section[];
  categoryIds: number[];
  tagIds: number[];
}

export async function listPosts(
  params: {
    q?: string;
    status?: "draft" | "published";
    page?: number;
    pageSize?: number;
  } = {},
) {
  const res = await apiClient.get("/api/posts", { params });
  return {
    items: unwrap<PostItem[]>(res.data),
    meta: (res.data as { meta?: Record<string, unknown> }).meta ?? {},
  };
}
export async function getPost(id: number) {
  const res = await apiClient.get(`/api/posts/${id}`);
  return unwrap<PostDetail>(res.data);
}
export async function createPost(input: PostInput) {
  const res = await apiClient.post("/api/posts", input);
  return unwrap<PostDetail>(res.data);
}
export async function updatePost(id: number, input: PostInput) {
  const res = await apiClient.put(`/api/posts/${id}`, input);
  return unwrap<PostDetail>(res.data);
}
export async function deletePost(id: number) {
  await apiClient.delete(`/api/posts/${id}`);
}
export async function reorderSections(
  postId: number,
  items: { id: number; order: number }[],
) {
  const res = await apiClient.put(`/api/posts/${postId}/sections/reorder`, {
    items,
  });
  return unwrap<Section[]>(res.data);
}
