// src/schemas/auth.schema.ts
import { z } from "zod";

export const LoginInputSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;
