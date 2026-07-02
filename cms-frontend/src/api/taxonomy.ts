import { apiClient, unwrap } from './client';

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
  const res = await apiClient.get('/api/categories');
  return unwrap<Category[]>(res.data);
}
export async function createCategory(input: { name: string; slug?: string }) {
  const res = await apiClient.post('/api/categories', input);
  return unwrap<Category>(res.data);
}
export async function updateCategory(id: number, input: { name?: string; slug?: string }) {
  const res = await apiClient.put(`/api/categories/${id}`, input);
  return unwrap<Category>(res.data);
}
export async function deleteCategory(id: number) {
  await apiClient.delete(`/api/categories/${id}`);
}

export async function listTags() {
  const res = await apiClient.get('/api/tags');
  return unwrap<Tag[]>(res.data);
}
export async function createTag(input: { name: string; slug?: string }) {
  const res = await apiClient.post('/api/tags', input);
  return unwrap<Tag>(res.data);
}
export async function updateTag(id: number, input: { name?: string; slug?: string }) {
  const res = await apiClient.put(`/api/tags/${id}`, input);
  return unwrap<Tag>(res.data);
}
export async function deleteTag(id: number) {
  await apiClient.delete(`/api/tags/${id}`);
}
