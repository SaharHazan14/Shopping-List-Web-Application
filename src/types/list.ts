export interface UserList {
  listId: number;
  title: string;
  description: string | null;
  creatorEmail: string;
  totalItems: number;
  checkedItems: number;
}

export interface ListDetails {
  id: number;
  title: string;
  description: string | null;
  creatorId: number;
}

export interface CreateListPayload {
  title: string;
  description?: string;
}

export interface UpdateListPayload {
  title?: string;
  description?: string;
}

export interface ListItem {
  listId: number;
  itemId: number;
  itemName: string;
  quantity: number;
  isChecked: boolean;
}

export interface AddListItemPayload {
  itemId: number;
  quantity: number;
  isChecked: boolean;
}

export interface UpdateListItemPayload {
  quantity?: number;
  isChecked?: boolean;
}
