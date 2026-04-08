import { api } from "./client";
import type { CurrentUser } from "../types/user";

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>("/user/me");
  return response.data;
}
