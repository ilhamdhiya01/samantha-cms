import { apiClient, unwrap } from "./client";

export type ImageItem = {
  url: string;
  caption?: string | null;
};

export type Section = {
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
};

export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  techStack: string[];
  liveUrl?: string | null;
  repoUrl?: string | null;
  status: "ongoing" | "completed" | "archived";
  startedAt?: string | null;
  endedAt?: string | null;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}
export interface Experience {
  id: number;
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
}
export interface Knowledge {
  id: number;
  question: string;
  answer: string;
  keywords: string[];
  enabled: boolean;
  updatedAt: string;
}

// Projects
export async function listProjects(
  params: {
    q?: string;
    status?: Project["status"];
    page?: number;
    pageSize?: number;
  } = {},
) {
  const res = await apiClient.get("/api/projects", { params });
  return {
    items: unwrap<Project[]>(res.data),
    meta: (res.data as { meta?: Record<string, unknown> }).meta ?? {},
  };
}
export async function getProject(id: number) {
  const res = await apiClient.get(`/api/projects/${id}`);
  return unwrap<Project>(res.data);
}
export async function createProject(
  input: Omit<Project, "id" | "slug" | "createdAt" | "updatedAt">,
) {
  const res = await apiClient.post("/api/projects", input);
  return unwrap<Project>(res.data);
}
export async function updateProject(
  id: number,
  input: Partial<Omit<Project, "id" | "slug" | "createdAt" | "updatedAt">>,
) {
  const res = await apiClient.put(`/api/projects/${id}`, input);
  return unwrap<Project>(res.data);
}
export async function deleteProject(id: number) {
  await apiClient.delete(`/api/projects/${id}`);
}
export async function reorderProjectSections(
  projectId: number,
  items: { id: number; order: number }[],
) {
  const res = await apiClient.put(
    `/api/projects/${projectId}/sections/reorder`,
    { items },
  );
  return unwrap<Section[]>(res.data);
}

// Experiences
export async function listExperiences() {
  const res = await apiClient.get("/api/experiences");
  return unwrap<Experience[]>(res.data);
}
export async function createExperience(input: Omit<Experience, "id">) {
  const res = await apiClient.post("/api/experiences", input);
  return unwrap<Experience>(res.data);
}
export async function updateExperience(
  id: number,
  input: Partial<Omit<Experience, "id">>,
) {
  const res = await apiClient.put(`/api/experiences/${id}`, input);
  return unwrap<Experience>(res.data);
}
export async function deleteExperience(id: number) {
  await apiClient.delete(`/api/experiences/${id}`);
}

// Knowledge
export async function listKnowledge(
  params: {
    q?: string;
    enabled?: boolean;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const res = await apiClient.get("/api/chatbot-knowledge", { params });
  return {
    items: unwrap<Knowledge[]>(res.data),
    meta: (res.data as { meta?: Record<string, unknown> }).meta ?? {},
  };
}
export async function createKnowledge(
  input: Omit<Knowledge, "id" | "updatedAt">,
) {
  const res = await apiClient.post("/api/chatbot-knowledge", input);
  return unwrap<Knowledge>(res.data);
}
export async function updateKnowledge(
  id: number,
  input: Partial<Omit<Knowledge, "id" | "updatedAt">>,
) {
  const res = await apiClient.put(`/api/chatbot-knowledge/${id}`, input);
  return unwrap<Knowledge>(res.data);
}
export async function deleteKnowledge(id: number) {
  await apiClient.delete(`/api/chatbot-knowledge/${id}`);
}
