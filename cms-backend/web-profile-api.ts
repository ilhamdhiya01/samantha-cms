// lib/cms-api.ts
// Drop into your web-profile project: src/lib/cms-api.ts
// Usage:
//   const posts = await cmsApi.public.listPosts();
//   const chat = await cmsApi.public.chatbot.ask({ question: "halo" });

import type {
  ApiResponse,
  ChatbotAskRequest,
  ChatbotAskResponse,
  ChatbotKnowledge,
  CreateChatbotKnowledgeRequest,
  CreatePostRequest,
  CreateSectionRequest,
  Experience,
  LoginRequest,
  LoginResponse,
  Media,
  MediaUploadResponse,
  Post,
  Project,
  ReorderSectionsRequest,
  Section,
  UpdateChatbotKnowledgeRequest,
  UpdatePostRequest,
  UpdateSectionRequest,
  Category,
  Tag,
} from "../types/cms";

const BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CMS_API_URL) ||
  (typeof import.meta !== "undefined" &&
    // @ts-expect-error - vite env
    import.meta.env?.VITE_CMS_API_URL) ||
  "http://43.157.223.21:4006";

class CmsError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type TokenProvider = () => string | null;

async function request<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });
  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok || !json.success) {
    throw new CmsError(
      json.error?.message || `HTTP ${res.status}`,
      json.error?.code || "UNKNOWN",
      res.status
    );
  }
  return json.data;
}

async function uploadFile<T>(
  path: string,
  file: File | Blob,
  filename: string,
  token: string
): Promise<T> {
  const form = new FormData();
  form.append("file", file, filename);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok || !json.success) {
    throw new CmsError(
      json.error?.message || `HTTP ${res.status}`,
      json.error?.code || "UNKNOWN",
      res.status
    );
  }
  return json.data;
}

// ============== PUBLIC (no token) ==============

export const publicApi = {
  // GET /api/posts  — list published posts
  listPosts: (params?: { page?: number; pageSize?: number; tag?: string; category?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.pageSize) q.set("pageSize", String(params.pageSize));
    if (params?.tag) q.set("tag", params.tag);
    if (params?.category) q.set("category", params.category);
    return request<Post[]>(`/api/posts?${q}`);
  },
  // GET /api/projects
  listProjects: () => request<Project[]>("/api/projects"),
  // GET /api/experiences
  listExperiences: () => request<Experience[]>("/api/experiences"),
  // GET /api/categories
  listCategories: () => request<Category[]>("/api/categories"),
  // GET /api/tags
  listTags: () => request<Tag[]>("/api/tags"),
  chatbot: {
    // POST /api/chatbot/ask — public knowledge-base query
    ask: (body: ChatbotAskRequest) =>
      request<ChatbotAskResponse>("/api/chatbot/ask", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};

// ============== ADMIN (token required) ==============

export function adminApi(getToken: TokenProvider) {
  const auth = <T>(path: string, init: RequestInit = {}) =>
    request<T>(path, { ...init, token: getToken() });

  return {
    auth: {
      login: (body: LoginRequest) =>
        request<LoginResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(body),
        }),
    },
    posts: {
      listAll: () => auth<Post[]>("/api/posts?all=1"),
      get: (id: number) => auth<Post>(`/api/posts/${id}`),
      create: (body: CreatePostRequest) =>
        auth<Post>("/api/posts", { method: "POST", body: JSON.stringify(body) }),
      update: (id: number, body: UpdatePostRequest) =>
        auth<Post>(`/api/posts/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      remove: (id: number) =>
        auth<{ id: number }>(`/api/posts/${id}`, { method: "DELETE" }),
      listSections: (postId: number) =>
        auth<Section[]>(`/api/posts/${postId}/sections`),
      reorderSections: (postId: number, body: ReorderSectionsRequest) =>
        auth<{ updated: number }>(`/api/posts/${postId}/sections/reorder`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      addSection: (postId: number, body: CreateSectionRequest) =>
        auth<Section>(`/api/posts/${postId}/sections`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      updateSection: (postId: number, sectionId: number, body: UpdateSectionRequest) =>
        auth<Section>(`/api/posts/${postId}/sections/${sectionId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      deleteSection: (postId: number, sectionId: number) =>
        auth<{ id: number }>(`/api/posts/${postId}/sections/${sectionId}`, {
          method: "DELETE",
        }),
    },
    media: {
      upload: (file: File | Blob, filename: string) => {
        const token = getToken();
        if (!token) throw new CmsError("Login required", "UNAUTHORIZED", 401);
        return uploadFile<MediaUploadResponse>("/api/media/upload", file, filename, token);
      },
      list: () => auth<Media[]>("/api/media"),
    },
    chatbotKnowledge: {
      list: () => auth<ChatbotKnowledge[]>("/api/chatbot-knowledge"),
      create: (body: CreateChatbotKnowledgeRequest) =>
        auth<ChatbotKnowledge>("/api/chatbot-knowledge", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: number, body: UpdateChatbotKnowledgeRequest) =>
        auth<ChatbotKnowledge>(`/api/chatbot-knowledge/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      remove: (id: number) =>
        auth<{ id: number }>(`/api/chatbot-knowledge/${id}`, {
          method: "DELETE",
        }),
    },
    projects: {
      create: (body: Omit<Project, "id" | "createdAt" | "updatedAt">) =>
        auth<Project>("/api/projects", { method: "POST", body: JSON.stringify(body) }),
      update: (id: number, body: Partial<Project>) =>
        auth<Project>(`/api/projects/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      remove: (id: number) =>
        auth<{ id: number }>(`/api/projects/${id}`, { method: "DELETE" }),
    },
    experiences: {
      create: (body: Omit<Experience, "id" | "createdAt" | "updatedAt">) =>
        auth<Experience>("/api/experiences", { method: "POST", body: JSON.stringify(body) }),
      update: (id: number, body: Partial<Experience>) =>
        auth<Experience>(`/api/experiences/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      remove: (id: number) =>
        auth<{ id: number }>(`/api/experiences/${id}`, { method: "DELETE" }),
    },
  };
}

export { CmsError };
export const CMS_BASE_URL = BASE_URL;
