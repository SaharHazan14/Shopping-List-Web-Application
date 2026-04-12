import { type ComponentProps, useState } from "react";
import { createItem } from "../api/item";
import type { CreateItemPayload, ItemCategory } from "../types/item";
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

interface CreateItemCardProps {
  onCreated: () => void;
  onCancel: () => void;
}

export default function CreateItemCard({ onCreated, onCancel }: CreateItemCardProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formatCategoryLabel = (value: string) => {
    const lowered = value.toLowerCase().replace(/_/g, " ");
    return lowered.charAt(0).toUpperCase() + lowered.slice(1);
  };

  const canCreate = name.trim().length >= 2 && category !== "";

  const handleCreateItem: NonNullable<ComponentProps<"form">["onSubmit"]> = async (e) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Item name must be at least 2 characters.");
      return;
    }

    if (!category) {
      setError("Category is required.");
      return;
    }

    try {
      setLoading(true);
      const payload: CreateItemPayload = {
        name: name.trim(),
        category,
      };
      await createItem(payload);
      setName("");
      setCategory("");
      onCreated();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message ?? err.message;
        setError(message || "Failed to create item.");
      } else {
        setError("Failed to create item.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (!open ? onCancel() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Item</DialogTitle>
          <DialogDescription>Add a name and category for your custom item.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleCreateItem}>
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
              onChange={(value) => setCategory(value as ItemCategory | "")}
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
              disabled={loading || !canCreate}
              className="min-w-32 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
            >
              {loading ? "Creating..." : "Create Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
