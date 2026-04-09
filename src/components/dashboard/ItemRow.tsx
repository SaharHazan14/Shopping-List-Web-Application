import { CheckCircle2, Circle, Trash2, PencilLine, ArrowRight } from "lucide-react";
import type { UserList } from "../../types/list";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface ItemRowProps {
  list: UserList;
  onOpen: (listId: number) => void;
  onEdit: (list: UserList) => void;
  onDelete: (list: UserList) => void;
  deleting: boolean;
}

export default function ItemRow({ list, onOpen, onEdit, onDelete, deleting }: ItemRowProps) {
  const total = list.totalItems;
  const checked = list.checkedItems;
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;
  const completed = total > 0 && checked === total;

  return (
    <Card className="group border-slate-200 p-5 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Circle className="h-4 w-4 text-slate-400" />
            )}
            <h3 className="truncate text-base font-semibold text-slate-900">{list.title}</h3>
          </div>
          <p className="mb-3 text-sm text-slate-500">{list.description ?? "No description"}</p>

          <div className="mb-2 h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {checked}/{total} completed • {list.creatorEmail}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpen(list.listId)}>
            <ArrowRight className="mr-1 h-3.5 w-3.5" />
            Open
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(list)}>
            <PencilLine className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(list)} disabled={deleting}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            {deleting ? "Deleting" : "Delete"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
