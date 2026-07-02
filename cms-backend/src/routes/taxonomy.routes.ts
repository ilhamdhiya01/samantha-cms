// src/routes/taxonomy.routes.ts
import { Router } from 'express';
import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  listTagsHandler,
  createTagHandler,
  updateTagHandler,
  deleteTagHandler,
} from '../controllers/taxonomy.controller.js';
import { authJwt } from '../middlewares/authJwt.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const categoryRouter = Router();
export const tagRouter = Router();

// Per PRD spec, all Category & Tag endpoints are admin-only.
categoryRouter.use(authJwt);
tagRouter.use(authJwt);

categoryRouter.get('/', asyncHandler(listCategoriesHandler));
categoryRouter.post('/', asyncHandler(createCategoryHandler));
categoryRouter.put('/:id', asyncHandler(updateCategoryHandler));
categoryRouter.delete('/:id', asyncHandler(deleteCategoryHandler));

tagRouter.get('/', asyncHandler(listTagsHandler));
tagRouter.post('/', asyncHandler(createTagHandler));
tagRouter.put('/:id', asyncHandler(updateTagHandler));
tagRouter.delete('/:id', asyncHandler(deleteTagHandler));
