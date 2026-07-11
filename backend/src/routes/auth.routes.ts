// src/routes/auth.routes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me } from '../controllers/auth.controller.js';
import { authJwt } from '../middlewares/authJwt.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const authRouter = Router();

// 5 req/min/IP as per PRD
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan login. Coba lagi nanti.' },
  },
});

authRouter.post('/login', loginLimiter, asyncHandler(login));
authRouter.get('/me', authJwt, asyncHandler(me));
