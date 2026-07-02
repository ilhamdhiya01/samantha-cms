import { Router } from 'express';
import {
  listProjectsHandler,
  getProjectHandler,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  listExperiencesHandler,
  createExperienceHandler,
  updateExperienceHandler,
  deleteExperienceHandler,
  listKnowledgeHandler,
  createKnowledgeHandler,
  updateKnowledgeHandler,
  deleteKnowledgeHandler,
} from '../controllers/content.controller.js';
import { authJwt } from '../middlewares/authJwt.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const projectRouter = Router();
export const experienceRouter = Router();
export const knowledgeRouter = Router();

// Per PRD spec, all Projects/Experiences/ChatbotKnowledge endpoints are admin-only.
projectRouter.use(authJwt);
experienceRouter.use(authJwt);
knowledgeRouter.use(authJwt);

// Projects
projectRouter.get('/', asyncHandler(listProjectsHandler));
projectRouter.get('/:id', asyncHandler(getProjectHandler));
projectRouter.post('/', asyncHandler(createProjectHandler));
projectRouter.put('/:id', asyncHandler(updateProjectHandler));
projectRouter.delete('/:id', asyncHandler(deleteProjectHandler));

// Experiences
experienceRouter.get('/', asyncHandler(listExperiencesHandler));
experienceRouter.post('/', asyncHandler(createExperienceHandler));
experienceRouter.put('/:id', asyncHandler(updateExperienceHandler));
experienceRouter.delete('/:id', asyncHandler(deleteExperienceHandler));

// Chatbot Knowledge
knowledgeRouter.get('/', asyncHandler(listKnowledgeHandler));
knowledgeRouter.post('/', asyncHandler(createKnowledgeHandler));
knowledgeRouter.put('/:id', asyncHandler(updateKnowledgeHandler));
knowledgeRouter.delete('/:id', asyncHandler(deleteKnowledgeHandler));
