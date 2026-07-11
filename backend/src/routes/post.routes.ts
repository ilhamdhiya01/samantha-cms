// src/routes/post.routes.ts
import { Router } from 'express';
import {
  list,
  getById,
  create,
  update,
  remove,
  sectionsReorder,
  listSections,
} from '../controllers/post.controller.js';
import {
  attachCategoryHandler,
  detachCategoryHandler,
  attachTagHandler,
  detachTagHandler,
} from '../controllers/taxonomy.controller.js';
import { authJwt } from '../middlewares/authJwt.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const postRouter = Router();

postRouter.get('/', asyncHandler(list));
postRouter.get('/:id', authJwt, asyncHandler(getById));
postRouter.get('/:id/sections', authJwt, asyncHandler(listSections));
postRouter.post('/', authJwt, asyncHandler(create));
postRouter.put('/:id', authJwt, asyncHandler(update));
postRouter.delete('/:id', authJwt, asyncHandler(remove));
postRouter.put('/:id/sections/reorder', authJwt, asyncHandler(sectionsReorder));

// Nested attach/detach
postRouter.post(
  '/:postId/categories/:categoryId',
  authJwt,
  asyncHandler(attachCategoryHandler)
);
postRouter.delete(
  '/:postId/categories/:categoryId',
  authJwt,
  asyncHandler(detachCategoryHandler)
);
postRouter.post('/:postId/tags/:tagId', authJwt, asyncHandler(attachTagHandler));
postRouter.delete('/:postId/tags/:tagId', authJwt, asyncHandler(detachTagHandler));
