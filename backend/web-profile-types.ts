// types/cms.ts
// Generated from backend/prisma/schema.prisma
// Copy this file into your web-profile project: src/types/cms.ts
// Backend URL: http://43.157.223.21:4006

// ============================================================
// ENUMS
// ============================================================

export type PostStatus = "draft" | "published";
export type SectionType =
  | "heading"
  | "paragraph"
  | "image"
  | "quote"
  | "code"
  | "divider";
export type ProjectStatus = "ongoing" | "completed" | "archived";
export type MediaType = "image" | "document" | "other";

// ============================================================
// MODELS (raw Prisma types)
// ============================================================

export interface Admin {
  id: number;
  email: string;
  passwordHash: string; // never returned by API
  name: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail: string | null;
  status: PostStatus;
  publishedAt: string | null;
  authorId: number;
  // author?: Admin; // not always joined
  sections?: Section[];
  categories?: (PostCategory & { category: Category })[];
  tags?: (PostTag & { tag: Tag })[];
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: number;
  postId: number;
  type: SectionType;
  order: number;
  text: string | null; // heading, paragraph, quote, code
  url: string | null; // image
  caption: string | null; // image
  level: number | null; // heading 1..6
  language: string | null; // code block
  createdAt: string;
  updatedAt: string;
}

export interface PostCategory {
  postId: number;
  categoryId: number;
  category?: Category;
}

export interface PostTag {
  postId: number;
  tagId: number;
  tag?: Tag;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  techStack: string[];
  liveUrl: string | null;
  repoUrl: string | null;
  status: ProjectStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: number;
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotKnowledge {
  id: number;
  question: string;
  answer: string;
  keywords: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: number;
  bucket: "blog" | "projects" | "misc";
  path: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  mediaType: MediaType;
  uploadedBy: number | null;
  createdAt: string;
}

// ============================================================
// API RESPONSE WRAPPER
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

// Paginated list (when API returns { items, total, page, pageSize })
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================
// AUTH
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: Pick<Admin, "id" | "email" | "name">;
}

// ============================================================
// POST DTOs
// ============================================================

export interface CreatePostRequest {
  title: string;
  slug: string;
  excerpt?: string | null;
  thumbnail?: string | null;
  status?: PostStatus;
  publishedAt?: string | null;
  authorId: number;
}

export interface UpdatePostRequest {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  thumbnail?: string | null;
  status?: PostStatus;
  publishedAt?: string | null;
}

export interface ReorderSectionsRequest {
  items: Array<{ id: number; order: number }>;
}

// ============================================================
// SECTION DTOs
// ============================================================

export interface CreateSectionRequest {
  type: SectionType;
  order: number;
  text?: string | null;
  url?: string | null;
  caption?: string | null;
  level?: number | null;
  language?: string | null;
}

export interface UpdateSectionRequest {
  type?: SectionType;
  order?: number;
  text?: string | null;
  url?: string | null;
  caption?: string | null;
  level?: number | null;
  language?: string | null;
}

// ============================================================
// CHATBOT KNOWLEDGE DTOs
// ============================================================

export interface CreateChatbotKnowledgeRequest {
  question: string;
  answer: string;
  keywords: string[];
  enabled?: boolean;
}

export interface UpdateChatbotKnowledgeRequest {
  question?: string;
  answer?: string;
  keywords?: string[];
  enabled?: boolean;
}

// ============================================================
// MEDIA UPLOAD
// ============================================================

export interface MediaUploadResponse {
  bucket: "blog" | "projects" | "misc";
  path: string;
  url: string; // public Supabase URL — ready to use in <img src>
  filename: string;
  mimeType: string;
  size: number;
  mediaType: MediaType;
}

// ============================================================
// PUBLIC CHATBOT (for the chatbot widget on web profile)
// ============================================================

export interface ChatbotAskRequest {
  question: string;
  // optional session id for conversation context
  sessionId?: string;
}

export interface ChatbotAskResponse {
  answer: string;
  source: "knowledge-base" | "fallback";
  matchedQuestion?: string;
  confidence?: number;
  sessionId: string;
}
