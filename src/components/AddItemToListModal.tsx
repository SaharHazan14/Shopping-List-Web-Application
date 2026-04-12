import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { getAllItems } from "../api/item";
import { addItemToList } from "../api/list";
import type { Item } from "../types/item";
import type { AddListItemPayload } from "../types/list";
import axios from "axios";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

interface AddItemToListModalProps {
  listId: number;
  onItemAdded: () => void;
  onCancel: () => void;
}

export default function AddItemToListModal({ listId, onItemAdded, onCancel }: AddItemToListModalProps) {
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [itemQuery, setItemQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        setCatalogLoading(true);
        setCatalogError(null);
        const items = await getAllItems();
        setCatalogItems(items);
        setSelectedItemId(null);
        setItemQuery("");
      } catch (err) {
        console.error("Failed to fetch catalog items:", err);
        setCatalogError("Failed to load catalog items.");
      } finally {
        setCatalogLoading(false);
      }
    }

    fetchCatalog();
  }, []);

  const filteredCatalogItems = useMemo(() => {
    const query = itemQuery.trim().toLowerCase();
    if (!query) return catalogItems;

    return catalogItems.filter((item) => {
      const searchableText = `${item.name} ${item.category}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [catalogItems, itemQuery]);

  const handleItemQueryChange = (value: string) => {
    setItemQuery(value);

    const normalizedValue = value.trim().toLowerCase();
    const exactMatch = catalogItems.find(
      (item) => `${item.name} (${item.category})`.toLowerCase() === normalizedValue,
    );

    setSelectedItemId(exactMatch ? exactMatch.id : null);
  };

  const handleAddItem: NonNullable<ComponentProps<"form">["onSubmit"]> = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (selectedItemId === null) {
      setSubmitError("Please select an item.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      setSubmitError("Quantity must be at least 1.");
      return;
    }

    try {
      setLoading(true);
      const payload: AddListItemPayload = {
        itemId: selectedItemId,
        quantity,
        isChecked: false,
      };
      await addItemToList(listId, payload);
      onItemAdded();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message ?? err.message;
        setSubmitError(message || "Failed to add item to list.");
      } else {
        setSubmitError("Failed to add item to list.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (!open ? onCancel() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
          <DialogDescription>Select an item from the catalog and set quantity.</DialogDescription>
        </DialogHeader>

        {catalogLoading ? <p className="text-sm text-slate-500">Loading catalog items...</p> : null}
        {catalogError ? <p className="text-sm text-red-600">{catalogError}</p> : null}

        {!catalogLoading && !catalogError ? (
          catalogItems.length === 0 ? (
            <p className="text-sm text-slate-500">No catalog items available.</p>
          ) : (
            <form className="space-y-4" onSubmit={handleAddItem}>
              <div className="space-y-1.5">
                <label htmlFor="item-select" className="text-sm font-medium text-slate-700">
                  Choose Item
                </label>
                <Input
                  id="item-select"
                  list="catalog-item-options"
                  placeholder="Search item"
                  value={itemQuery}
                  onChange={(event) => handleItemQueryChange(event.target.value)}
                  disabled={loading || catalogItems.length === 0}
                />
                <datalist id="catalog-item-options">
                  {filteredCatalogItems.map((item) => (
                    <option key={item.id} value={`${item.name} (${item.category})`} />
                  ))}
                </datalist>
                {itemQuery.trim().length > 0 && filteredCatalogItems.length === 0 ? (
                  <p className="text-xs text-slate-500">No items match your search.</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="quantity" className="text-sm font-medium text-slate-700">
                  Quantity
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  disabled={loading}
                />
              </div>

              {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-32 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                >
                  {loading ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
