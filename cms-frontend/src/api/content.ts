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
  const res = await apiClient.get("/projects", { params });
  return {
    items: unwrap<Project[]>(res.data),
    meta: (res.data as { meta?: Record<string, unknown> }).meta ?? {},
  };
}
export async function getProject(id: number) {
  const res = await apiClient.get(`/projects/${id}`);
  return unwrap<Project>(res.data);
}
export async function createProject(
  input: Omit<Project, "id" | "slug" | "createdAt" | "updatedAt">,
) {
  const res = await apiClient.post("/projects", input);
  return unwrap<Project>(res.data);
}
export async function updateProject(
  id: number,
  input: Partial<Omit<Project, "id" | "slug" | "createdAt" | "updatedAt">>,
) {
  const res = await apiClient.put(`/projects/${id}`, input);
  return unwrap<Project>(res.data);
}
export async function deleteProject(id: number) {
  await apiClient.delete(`/projects/${id}`);
}
export async function reorderProjectSections(
  projectId: number,
  items: { id: number; order: number }[],
) {
  const res = await apiClient.put(`/projects/${projectId}/sections/reorder`, {
    items,
  });
  return unwrap<Section[]>(res.data);
}

// Experiences
export async function listExperiences() {
  const res = await apiClient.get("/experiences");
  return unwrap<Experience[]>(res.data);
}
export async function createExperience(input: Omit<Experience, "id">) {
  const res = await apiClient.post("/experiences", input);
  return unwrap<Experience>(res.data);
}
export async function updateExperience(
  id: number,
  input: Partial<Omit<Experience, "id">>,
) {
  const res = await apiClient.put(`/experiences/${id}`, input);
  return unwrap<Experience>(res.data);
}
export async function deleteExperience(id: number) {
  await apiClient.delete(`/experiences/${id}`);
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
  const res = await apiClient.get("/chatbot-knowledge", { params });
  return {
    items: unwrap<Knowledge[]>(res.data),
    meta: (res.data as { meta?: Record<string, unknown> }).meta ?? {},
  };
}
export async function createKnowledge(
  input: Omit<Knowledge, "id" | "updatedAt">,
) {
  const res = await apiClient.post("/chatbot-knowledge", input);
  return unwrap<Knowledge>(res.data);
}
export async function updateKnowledge(
  id: number,
  input: Partial<Omit<Knowledge, "id" | "updatedAt">>,
) {
  const res = await apiClient.put(`/chatbot-knowledge/${id}`, input);
  return unwrap<Knowledge>(res.data);
}
export async function deleteKnowledge(id: number) {
  await apiClient.delete(`/chatbot-knowledge/${id}`);
}
