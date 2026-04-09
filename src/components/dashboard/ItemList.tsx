import type { UserList } from "../../types/list";
import ItemRow from "./ItemRow";

interface ItemListProps {
  lists: UserList[];
  deletingListId: number | null;
  onOpen: (listId: number) => void;
  onEdit: (list: UserList) => void;
  onDelete: (list: UserList) => void;
}

export default function ItemList({
  lists,
  deletingListId,
  onOpen,
  onEdit,
  onDelete,
}: ItemListProps) {
  if (lists.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <p className="text-base font-medium text-slate-700">No items yet</p>
        <p className="mt-1 text-sm text-slate-500">Use the input above to create your first shopping entry.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {lists.map((list) => (
        <ItemRow
          key={list.listId}
          list={list}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          deleting={deletingListId === list.listId}
        />
      ))}
    </div>
  );
}
