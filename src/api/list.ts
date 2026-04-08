import { api } from "./client";
import type { UserList } from "../types/list";

export interface CreateListPayload {
  title: string;
  description?: string;
}

export interface UpdateListPayload {
  title?: string;
  description?: string;
}

export async function getCurrentUserLists(): Promise<UserList[]> {
  const response = await api.get<UserList[]>("/list?includeMember=true");
  return response.data;
}

export async function createList(payload: CreateListPayload): Promise<void> {
  await api.post("/list", payload);
}

export async function updateListDetails(listId: number, payload: UpdateListPayload): Promise<void> {
  await api.patch(`/list/${listId}`, payload);
}

export async function deleteList(listId: number): Promise<void> {
  await api.delete(`/list/${listId}`);
}
