import { Router } from 'express';
import multer from 'multer';
import { uploadHandler, listHandler, deleteHandler } from '../controllers/media.controller.js';
import { authJwt } from '../middlewares/authJwt.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { fileFilter, MAX_FILE_SIZE } from '../config/storage.js';

export const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

mediaRouter.post('/upload', authJwt, upload.single('file'), asyncHandler(uploadHandler));
mediaRouter.get('/', authJwt, asyncHandler(listHandler));
mediaRouter.delete('/:bucket/*', authJwt, asyncHandler(deleteHandler));
