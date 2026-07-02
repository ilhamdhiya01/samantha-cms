import type { Request, Response } from 'express';
import { fail, ok, created, noContent } from '../lib/apiResponse.js';
import { HttpError } from '../middlewares/errorHandler.js';
import {
  ProjectInputSchema,
  ProjectPatchSchema,
  ProjectQuerySchema,
  ExperienceInputSchema,
  ExperiencePatchSchema,
  KnowledgeInputSchema,
  KnowledgePatchSchema,
  KnowledgeQuerySchema,
} from '../schemas/content.schema.js';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from '../services/content.service.js';

function idFromReq(req: Request, key = 'id'): number {
  const id = Number(req.params[key]);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'INVALID_ID', `${key} tidak valid`);
  return id;
}

// Projects
export async function listProjectsHandler(req: Request, res: Response) {
  const parsed = ProjectQuerySchema.safeParse(req.query);
  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Query tidak valid', parsed.error.flatten());
  const data = await listProjects(parsed.data);
  return ok(res, data.items, data.pagination);
}
export async function getProjectHandler(req: Request, res: Response) {
  return ok(res, await getProject(idFromReq(req)));
}
export async function createProjectHandler(req: Request, res: Response) {
  const parsed = ProjectInputSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  return created(res, await createProject(parsed.data));
}
export async function updateProjectHandler(req: Request, res: Response) {
  const parsed = ProjectPatchSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  return ok(res, await updateProject(idFromReq(req), parsed.data));
}
export async function deleteProjectHandler(req: Request, res: Response) {
  await deleteProject(idFromReq(req));
  return noContent(res);
}

// Experiences
export async function listExperiencesHandler(_req: Request, res: Response) {
  return ok(res, await listExperiences());
}
export async function createExperienceHandler(req: Request, res: Response) {
  const parsed = ExperienceInputSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  return created(res, await createExperience(parsed.data));
}
export async function updateExperienceHandler(req: Request, res: Response) {
  const parsed = ExperiencePatchSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  return ok(res, await updateExperience(idFromReq(req), parsed.data));
}
export async function deleteExperienceHandler(req: Request, res: Response) {
  await deleteExperience(idFromReq(req));
  return noContent(res);
}

// Knowledge
export async function listKnowledgeHandler(req: Request, res: Response) {
  const parsed = KnowledgeQuerySchema.safeParse(req.query);
  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Query tidak valid', parsed.error.flatten());
  const data = await listKnowledge(parsed.data);
  return ok(res, data.items, data.pagination);
}
export async function createKnowledgeHandler(req: Request, res: Response) {
  const parsed = KnowledgeInputSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  return created(res, await createKnowledge(parsed.data));
}
export async function updateKnowledgeHandler(req: Request, res: Response) {
  const parsed = KnowledgePatchSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Payload tidak valid', parsed.error.flatten());
  return ok(res, await updateKnowledge(idFromReq(req), parsed.data));
}
export async function deleteKnowledgeHandler(req: Request, res: Response) {
  await deleteKnowledge(idFromReq(req));
  return noContent(res);
}
