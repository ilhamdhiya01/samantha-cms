// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigins, env } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { postRouter } from "./routes/post.routes.js";
import { categoryRouter, tagRouter } from "./routes/taxonomy.routes.js";
import {
  projectRouter,
  experienceRouter,
  knowledgeRouter,
} from "./routes/content.routes.js";
import { mediaRouter } from "./routes/media.routes.js";

export function createApp() {
  const app = express();

  // Security
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  // Parsers
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Routes
  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/posts", postRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/tags", tagRouter);
  app.use("/api/projects", projectRouter);
  app.use("/api/experiences", experienceRouter);
  app.use("/api/chatbot-knowledge", knowledgeRouter);
  app.use("/api/media", mediaRouter);
  app.get("/", (_req, res) => {
    res.json({
      success: true,
      data: {
        name: "samantha-cms-backend",
        env: env.NODE_ENV,
        version: "0.1.0",
        docs: "/health",
      },
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
