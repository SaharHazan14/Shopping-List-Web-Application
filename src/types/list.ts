export interface UserList {
  listId: number;
  title: string;
  description: string | null;
  creatorEmail: string;
  totalItems: number;
  checkedItems: number;
}
