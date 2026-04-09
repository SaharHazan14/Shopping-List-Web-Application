import { api } from "./client";
import type { CreateItemPayload, Item, UpdateItemPayload } from "../types/item";

export async function getAllItems(): Promise<Item[]> {
  const response = await api.get<Item[]>("/item?global=true");
  return response.data;
}

export async function createItem(payload: CreateItemPayload): Promise<Item> {
  const response = await api.post<Item>("/item", payload);
  return response.data;
}

export async function updateItem(itemId: number, payload: UpdateItemPayload): Promise<Item> {
  const response = await api.patch<Item>(`/item/${itemId}`, payload);
  return response.data;
}

export async function deleteItem(itemId: number): Promise<void> {
  await api.delete(`/item/${itemId}`);
}
