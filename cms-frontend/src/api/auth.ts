import { apiClient, unwrap } from "./client";
import type { AdminPayload } from "@/store/auth";

export async function login(email: string, password: string) {
  const res = await apiClient.post("/auth/login", { email, password });
  return unwrap<{ token: string; admin: AdminPayload; expiresIn: string }>(
    res.data,
  );
}

export async function me() {
  const res = await apiClient.get("/auth/me");
  return unwrap<AdminPayload>(res.data);
}
