import { type ComponentProps, useState } from "react";
import { updateItem } from "../api/item";
import type { UpdateItemPayload, ItemCategory, Item } from "../types/item";
import { ItemCategory as ItemCategoryEnum } from "../types/item";
import axios from "axios";
import { Button } from "./ui/button";
import { Select } from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

interface UpdateItemCardProps {
  item: Item;
  onUpdated: () => void;
  onCancel: () => void;
}

export default function UpdateItemCard({ item, onUpdated, onCancel }: UpdateItemCardProps) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<ItemCategory>(item.category);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formatCategoryLabel = (value: string) => {
    const lowered = value.toLowerCase().replace(/_/g, " ");
    return lowered.charAt(0).toUpperCase() + lowered.slice(1);
  };

  const nameChanged = name.trim() !== item.name;
  const categoryChanged = category !== item.category;
  const canUpdate = name.trim().length >= 2 && !!category && (nameChanged || categoryChanged);

  const handleUpdateItem: NonNullable<ComponentProps<"form">["onSubmit"]> = async (e) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Item name must be at least 2 characters.");
      return;
    }

    if (!nameChanged && !categoryChanged) {
      setError("Provide at least one field: name or category.");
      return;
    }

    try {
      setLoading(true);
      const payload: UpdateItemPayload = {};
      if (nameChanged) payload.name = name.trim();
      if (categoryChanged) payload.category = category;

      await updateItem(item.id, payload);
      onUpdated();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message ?? err.message;
        setError(message || "Failed to update item.");
      } else {
        setError("Failed to update item.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (!open ? onCancel() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>Update the name or category for this custom item.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleUpdateItem}>
          <div>
            <Input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              disabled={loading}
            />
          </div>

          <div>
            <Select
              id="item-category"
              value={category}
              onChange={(value) => setCategory(value as ItemCategory)}
              options={Object.entries(ItemCategoryEnum).map(([, value]) => ({
                value,
                label: formatCategoryLabel(value),
              }))}
              placeholder="Category"
              disabled={loading}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || !canUpdate}
              className="min-w-32 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
            >
              {loading ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
