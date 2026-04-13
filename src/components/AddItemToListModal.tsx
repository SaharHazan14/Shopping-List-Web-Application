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
import { Search } from "lucide-react";

interface AddItemToListModalProps {
  listId: number;
  onItemAdded: () => void;
  onCancel: () => void;
  existingItemIds?: number[];
}

export default function AddItemToListModal({ listId, onItemAdded, onCancel, existingItemIds = [] }: AddItemToListModalProps) {
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [itemQuery, setItemQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
    // Filter out items already in the list
    const availableItems = catalogItems.filter((item) => !existingItemIds.includes(item.id));
    
    const query = itemQuery.trim().toLowerCase();
    if (!query) return availableItems;

    return availableItems.filter((item) => {
      const searchableText = `${item.name} ${item.category}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [catalogItems, itemQuery, existingItemIds]);

  const handleItemQueryChange = (value: string) => {
    setItemQuery(value);
    setShowDropdown(true);
    setSelectedItemId(null);
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItemId(item.id);
    setItemQuery(item.name);
    setShowDropdown(false);
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
          filteredCatalogItems.length === 0 && catalogItems.length === 0 ? (
            <p className="text-sm text-slate-500">No catalog items available.</p>
          ) : (
            <form className="space-y-4" onSubmit={handleAddItem}>
              <div className="space-y-1.5">
                <label htmlFor="item-select" className="text-sm font-medium text-slate-700">
                  Choose Item
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="item-select"
                      placeholder="Search or select item"
                      value={itemQuery}
                      onChange={(event) => handleItemQueryChange(event.target.value)}
                      onFocus={() => setShowDropdown(true)}
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredCatalogItems.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          {itemQuery.trim().length > 0
                            ? "No items match your search."
                            : "No available items."}
                        </div>
                      ) : (
                        filteredCatalogItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectItem(item)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 transition-colors ${
                              selectedItemId === item.id ? "bg-emerald-100" : ""
                            }`}
                          >
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.category}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedItemId && (
                  <p className="text-sm text-emerald-600 font-medium">
                    ✓ Selected: {catalogItems.find((i) => i.id === selectedItemId)?.name}
                  </p>
                )}
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
                  disabled={loading || selectedItemId === null}
                  className="min-w-32 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
