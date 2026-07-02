import { z } from "zod";

const SectionImageItemSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional().nullable(),
});

export const ProjectSectionInputSchema: z.ZodType<ProjectSectionInput> = z.lazy(
  () =>
    z
      .object({
        id: z.number().int().optional(),
        type: z.enum([
          "heading",
          "paragraph",
          "image",
          "image_group",
          "quote",
          "code",
          "divider",
        ]),
        order: z.number().int().min(0),
        text: z.string().optional().nullable(),
        url: z.string().url().optional().nullable(),
        caption: z.string().optional().nullable(),
        images: z.array(SectionImageItemSchema).optional().nullable(),
        children: z.array(ProjectSectionInputSchema).optional().nullable(),
        level: z.number().int().min(1).max(6).optional().nullable(),
        language: z.string().optional().nullable(),
      })
      .refine(
        (data) => {
          if (data.type === "image_group") {
            return (
              data.images !== null &&
              data.images !== undefined &&
              data.images.length > 0
            );
          }
          return true;
        },
        {
          message: "images wajib berisi minimal 1 item untuk type image_group",
          path: ["images"],
        },
      ),
);

export type ProjectSectionInput = {
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

/**
 * @description Preprocesses date strings to ISO 8601 datetime format.
 * Accepts YYYY-MM-DD date-only strings and appends a zero-time UTC suffix.
 * Preserves null, undefined, and empty string values.
 * @template T - The underlying Zod schema type.
 * @param {T} schema - The underlying Zod schema to validate the processed value.
 * @returns {z.ZodEffects<T>} A ZodEffects schema that preprocesses the input.
 */
function parseDateTimeInput<T extends z.ZodTypeAny>(
  schema: T,
): z.ZodEffects<T> {
  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return val;
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return `${val}T00:00:00.000Z`;
    }
    return val;
  }, schema);
}

export const ProjectInputSchema = z.object({
  title: z.string().min(1).max(150),
  slug: z.string().min(1).max(170).optional(),
  description: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
  techStack: z.array(z.string().min(1)).default([]),
  liveUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url().optional().nullable(),
  ),
  repoUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url().optional().nullable(),
  ),
  status: z.enum(["ongoing", "completed", "archived"]).default("ongoing"),
  startedAt: parseDateTimeInput(z.string().datetime().optional().nullable()),
  endedAt: parseDateTimeInput(z.string().datetime().optional().nullable()),
  sections: z.array(ProjectSectionInputSchema).optional().default([]),
});
export const ProjectQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["ongoing", "completed", "archived"]).optional(),
  tech: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const ProjectPatchSchema = ProjectInputSchema.partial();

export const ExperienceInputSchema = z.object({
  company: z.string().min(1).max(150),
  role: z.string().min(1).max(150),
  description: z.string().min(1),
  startDate: parseDateTimeInput(z.string().datetime()),
  endDate: parseDateTimeInput(z.string().datetime().optional().nullable()),
  location: z.string().max(150).optional().nullable(),
});
export const ExperiencePatchSchema = ExperienceInputSchema.partial();

export const KnowledgeInputSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1),
  keywords: z.array(z.string().min(1)).default([]),
  enabled: z.boolean().default(true),
});
export const KnowledgePatchSchema = KnowledgeInputSchema.partial();
export const KnowledgeQuerySchema = z.object({
  q: z.string().optional(),
  enabled: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
