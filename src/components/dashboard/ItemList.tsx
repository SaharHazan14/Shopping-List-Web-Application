import type { UserList } from "../../types/list";
import ItemRow from "./ItemRow";

interface ItemListProps {
  lists: UserList[];
  deletingListId: number | null;
  emptyTitle: string;
  emptyDescription: string;
  showOwnerActions?: boolean;
  onOpen: (listId: number) => void;
  onEdit: (list: UserList) => void;
  onDelete: (list: UserList) => void;
}

export default function ItemList({
  lists,
  deletingListId,
  emptyTitle,
  emptyDescription,
  showOwnerActions = true,
  onOpen,
  onEdit,
  onDelete,
}: ItemListProps) {
  if (lists.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <p className="text-base font-medium text-slate-700">{emptyTitle}</p>
        <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {lists.map((list) => (
        <ItemRow
          key={list.listId}
          list={list}
          showOwnerActions={showOwnerActions}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          deleting={deletingListId === list.listId}
        />
      ))}
    </div>
  );
}
