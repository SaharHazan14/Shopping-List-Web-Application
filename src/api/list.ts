import { api } from "./client";
import type {
  AddListMemberPayload,
  AddListItemPayload,
  CreateListPayload,
  ListDetails,
  ListItem,
  ListMember,
  UpdateListItemPayload,
  UpdateListMemberPayload,
  UpdateListPayload,
  UserList,
} from "../types/list";

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

export async function getListById(listId: number): Promise<ListDetails> {
  const response = await api.get<ListDetails>(`/list/${listId}`);
  return response.data;
}

export async function getListItems(listId: number): Promise<ListItem[]> {
  const response = await api.get<ListItem[]>(`/list/${listId}/item`);
  return response.data;
}

export async function addItemToList(listId: number, payload: AddListItemPayload): Promise<ListItem> {
  const response = await api.post<ListItem>(`/list/${listId}/item`, payload);
  return response.data;
}

export async function updateListItem(listId: number, itemId: number, payload: UpdateListItemPayload): Promise<ListItem> {
  const response = await api.patch<ListItem>(`/list/${listId}/item/${itemId}`, payload);
  return response.data;
}

export async function deleteListItem(listId: number, itemId: number): Promise<void> {
  await api.delete(`/list/${listId}/item/${itemId}`);
}

export async function getListMembers(listId: number): Promise<ListMember[]> {
  const response = await api.get<ListMember[]>(`/list/${listId}/member`);
  return response.data;
}

export async function updateListMember(
  listId: number,
  memberId: number,
  payload: UpdateListMemberPayload,
): Promise<ListMember> {
  const response = await api.patch<ListMember>(`/list/${listId}/member/${memberId}`, payload);
  return response.data;
}

export async function deleteListMember(listId: number, memberId: number): Promise<void> {
  await api.delete(`/list/${listId}/member/${memberId}`);
}

export async function addListMember(listId: number, payload: AddListMemberPayload): Promise<ListMember> {
  const response = await api.post<ListMember>(`/list/${listId}/member`, payload);
  return response.data;
}
