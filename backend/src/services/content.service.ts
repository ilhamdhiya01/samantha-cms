import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { slugify } from "../lib/slugify.js";
import { HttpError } from "../middlewares/errorHandler.js";

function parseId(raw: string, label: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0)
    throw new HttpError(400, "INVALID_ID", `${label} tidak valid`);
  return id;
}

async function ensureProjectSlug(
  base: string,
  ignoreId?: number,
): Promise<string> {
  let slug = base || "project";
  let n = 1;
  while (n < 200) {
    const found = await prisma.project.findUnique({ where: { slug } });
    if (!found || found.id === ignoreId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

type ProjectSectionInput = {
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
  images?: { url: string; caption?: string | null }[] | null;
  children?: ProjectSectionInput[] | null;
  level?: number | null;
  language?: string | null;
};

function buildProjectSectionsCreateInput(
  sections: ProjectSectionInput[],
): Prisma.ProjectSectionCreateManyProjectInput[] {
  return sections.map((s) => ({
    type: s.type,
    order: s.order,
    text: s.text ?? null,
    url: s.url ?? null,
    caption: s.caption ?? null,
    images: s.images ? (s.images as Prisma.InputJsonValue) : Prisma.JsonNull,
    children: s.children
      ? (s.children as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    level: s.level ?? null,
    language: s.language ?? null,
  }));
}

// Projects
export async function listProjects(params: {
  q?: string;
  status?: "ongoing" | "completed" | "archived";
  tech?: string;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.ProjectWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.tech) {
    where.techStack = { has: params.tech };
  }
  const [total, items] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: [{ startedAt: "desc" }, { updatedAt: "desc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        sections: { orderBy: { order: "asc" } },
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

export async function getProject(id: number) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { order: "asc" } },
    },
  });
  if (!project)
    throw new HttpError(404, "NOT_FOUND", "Project tidak ditemukan");
  return project;
}

export async function createProject(input: {
  title: string;
  slug?: string;
  description: string;
  imageUrl?: string | null;
  techStack: string[];
  liveUrl?: string | null;
  repoUrl?: string | null;
  status: "ongoing" | "completed" | "archived";
  startedAt?: string | null;
  endedAt?: string | null;
  sections?: ProjectSectionInput[];
}) {
  const base = slugify(input.slug || input.title);
  const slug = await ensureProjectSlug(base);
  const sectionData = input.sections?.length
    ? buildProjectSectionsCreateInput(input.sections)
    : [];
  return prisma.project.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      imageUrl: input.imageUrl ?? null,
      techStack: input.techStack ?? [],
      liveUrl: input.liveUrl ?? null,
      repoUrl: input.repoUrl ?? null,
      status: input.status,
      startedAt: input.startedAt ? new Date(input.startedAt) : null,
      endedAt: input.endedAt ? new Date(input.endedAt) : null,
      sections: sectionData.length ? { create: sectionData } : undefined,
    },
    include: {
      sections: { orderBy: { order: "asc" } },
    },
  });
}

export async function updateProject(
  id: number,
  input: Partial<{
    title: string;
    slug: string;
    description: string;
    imageUrl: string | null;
    techStack: string[];
    liveUrl: string | null;
    repoUrl: string | null;
    status: "ongoing" | "completed" | "archived";
    startedAt: string | null;
    endedAt: string | null;
    sections: ProjectSectionInput[];
  }>,
) {
  const exists = await prisma.project.findUnique({ where: { id } });
  if (!exists) throw new HttpError(404, "NOT_FOUND", "Project tidak ditemukan");

  const shouldReplaceSections = input.sections !== undefined;
  const sectionData = shouldReplaceSections
    ? buildProjectSectionsCreateInput(input.sections ?? [])
    : [];

  const data: Prisma.ProjectUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.slug !== undefined)
    data.slug = await ensureProjectSlug(slugify(input.slug), id);
  if (input.description !== undefined) data.description = input.description;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
  if (input.techStack !== undefined) data.techStack = input.techStack;
  if (input.liveUrl !== undefined) data.liveUrl = input.liveUrl;
  if (input.repoUrl !== undefined) data.repoUrl = input.repoUrl;
  if (input.status !== undefined) data.status = input.status;
  if (input.startedAt !== undefined)
    data.startedAt = input.startedAt ? new Date(input.startedAt) : null;
  if (input.endedAt !== undefined)
    data.endedAt = input.endedAt ? new Date(input.endedAt) : null;

  if (shouldReplaceSections) {
    await prisma.$transaction([
      prisma.projectSection.deleteMany({ where: { projectId: id } }),
      prisma.project.update({
        where: { id },
        data,
        include: { sections: { orderBy: { order: "asc" } } },
      }),
      ...(sectionData.length
        ? [
            prisma.projectSection.createMany({
              data: sectionData.map((s) => ({ ...s, projectId: id })),
            }),
          ]
        : []),
    ]);
    return prisma.project.findUnique({
      where: { id },
      include: { sections: { orderBy: { order: "asc" } } },
    });
  }

  return prisma.project.update({
    where: { id },
    data,
    include: { sections: { orderBy: { order: "asc" } } },
  });
}

export async function deleteProject(id: number) {
  try {
    await prisma.project.delete({ where: { id } });
  } catch {
    throw new HttpError(404, "NOT_FOUND", "Project tidak ditemukan");
  }
}

// Experiences
export async function listExperiences() {
  return prisma.experience.findMany({ orderBy: [{ startDate: "desc" }] });
}

export async function createExperience(input: {
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
}) {
  return prisma.experience.create({
    data: {
      company: input.company,
      role: input.role,
      description: input.description,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      location: input.location ?? null,
    },
  });
}

export async function updateExperience(
  id: number,
  input: Partial<{
    company: string;
    role: string;
    description: string;
    startDate: string;
    endDate: string | null;
    location: string | null;
  }>,
) {
  const exists = await prisma.experience.findUnique({ where: { id } });
  if (!exists)
    throw new HttpError(404, "NOT_FOUND", "Experience tidak ditemukan");
  const data: Prisma.ExperienceUpdateInput = {};
  if (input.company !== undefined) data.company = input.company;
  if (input.role !== undefined) data.role = input.role;
  if (input.description !== undefined) data.description = input.description;
  if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
  if (input.endDate !== undefined)
    data.endDate = input.endDate ? new Date(input.endDate) : null;
  if (input.location !== undefined) data.location = input.location;
  return prisma.experience.update({ where: { id }, data });
}

export async function deleteExperience(id: number) {
  try {
    await prisma.experience.delete({ where: { id } });
  } catch {
    throw new HttpError(404, "NOT_FOUND", "Experience tidak ditemukan");
  }
}

// Chatbot Knowledge
export async function listKnowledge(params: {
  q?: string;
  enabled?: boolean;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.ChatbotKnowledgeWhereInput = {};
  if (params.enabled !== undefined) where.enabled = params.enabled;
  if (params.q) {
    where.OR = [
      { question: { contains: params.q, mode: "insensitive" } },
      { answer: { contains: params.q, mode: "insensitive" } },
    ];
  }
  const [total, items] = await Promise.all([
    prisma.chatbotKnowledge.count({ where }),
    prisma.chatbotKnowledge.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
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

export async function createKnowledge(input: {
  question: string;
  answer: string;
  keywords: string[];
  enabled: boolean;
}) {
  return prisma.chatbotKnowledge.create({
    data: {
      question: input.question,
      answer: input.answer,
      keywords: input.keywords ?? [],
      enabled: input.enabled ?? true,
    },
  });
}

export async function updateKnowledge(
  id: number,
  input: Partial<{
    question: string;
    answer: string;
    keywords: string[];
    enabled: boolean;
  }>,
) {
  const exists = await prisma.chatbotKnowledge.findUnique({ where: { id } });
  if (!exists)
    throw new HttpError(404, "NOT_FOUND", "Knowledge tidak ditemukan");
  const data: Prisma.ChatbotKnowledgeUpdateInput = {};
  if (input.question !== undefined) data.question = input.question;
  if (input.answer !== undefined) data.answer = input.answer;
  if (input.keywords !== undefined) data.keywords = input.keywords;
  if (input.enabled !== undefined) data.enabled = input.enabled;
  return prisma.chatbotKnowledge.update({ where: { id }, data });
}

export async function deleteKnowledge(id: number) {
  try {
    await prisma.chatbotKnowledge.delete({ where: { id } });
  } catch {
    throw new HttpError(404, "NOT_FOUND", "Knowledge tidak ditemukan");
  }
}

export const __test = { parseId };
