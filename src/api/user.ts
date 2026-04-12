import { api } from "./client";
import type { CurrentUser } from "../types/user";

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>("/user/me");
  return response.data;
}

export async function getUsers(): Promise<CurrentUser[]> {
  const response = await api.get<CurrentUser[]>("/user");
  return response.data;
}
