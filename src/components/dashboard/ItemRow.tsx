import { CheckCircle2, Circle, User } from "lucide-react";
import type { UserList } from "../../types/list";
import { Card } from "../ui/card";

interface ItemRowProps {
  list: UserList;
  onOpen: (listId: number) => void;
}

export default function ItemRow({
  list,
  onOpen,
}: ItemRowProps) {
  const total = list.totalItems;
  const checked = list.checkedItems;
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;
  const completed = total > 0 && checked === total;

  return (
    <Card
      className="group cursor-pointer border-slate-200 p-5 hover:-translate-y-0.5 hover:shadow-lg"
      onClick={() => onOpen(list.listId)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(list.listId);
        }
      }}
    >
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
          <p className="mb-4 text-sm text-slate-500">{list.description ?? "No description"}</p>

          <p className="mb-2 text-xs font-medium text-slate-600">{progress}% completed</p>
          <div className="mb-2 h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <User className="h-3.5 w-3.5" />
            <span>Created by {list.creatorEmail}</span>
          </div>
        </div>

      </div>
    </Card>
  );
}
