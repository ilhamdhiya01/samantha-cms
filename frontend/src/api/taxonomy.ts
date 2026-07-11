import { apiClient, unwrap } from "./client";

export interface Category {
  id: number;
  name: string;
  slug: string;
}
export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export async function listCategories() {
  const res = await apiClient.get("/categories");
  return unwrap<Category[]>(res.data);
}
export async function createCategory(input: { name: string; slug?: string }) {
  const res = await apiClient.post("/categories", input);
  return unwrap<Category>(res.data);
}
export async function updateCategory(
  id: number,
  input: { name?: string; slug?: string },
) {
  const res = await apiClient.put(`/categories/${id}`, input);
  return unwrap<Category>(res.data);
}
export async function deleteCategory(id: number) {
  await apiClient.delete(`/categories/${id}`);
}

export async function listTags() {
  const res = await apiClient.get("/tags");
  return unwrap<Tag[]>(res.data);
}
export async function createTag(input: { name: string; slug?: string }) {
  const res = await apiClient.post("/tags", input);
  return unwrap<Tag>(res.data);
}
export async function updateTag(
  id: number,
  input: { name?: string; slug?: string },
) {
  const res = await apiClient.put(`/tags/${id}`, input);
  return unwrap<Tag>(res.data);
}
export async function deleteTag(id: number) {
  await apiClient.delete(`/tags/${id}`);
}
