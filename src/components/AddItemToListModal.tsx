import { type ComponentProps, useEffect, useState } from "react";
import { getAllItems } from "../api/item";
import { addItemToList } from "../api/list";
import type { Item } from "../types/item";
import type { AddListItemPayload } from "../types/list";
import axios from "axios";

interface AddItemToListModalProps {
  listId: number;
  onItemAdded: () => void;
  onCancel: () => void;
}

export default function AddItemToListModal({ listId, onItemAdded, onCancel }: AddItemToListModalProps) {
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isChecked, setIsChecked] = useState(false);
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
        if (items.length > 0) {
          setSelectedItemId(items[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch catalog items:", err);
        setCatalogError("Failed to load catalog items.");
      } finally {
        setCatalogLoading(false);
      }
    }

    fetchCatalog();
  }, []);

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
        isChecked,
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Add Item to List</h2>

        {catalogLoading ? (
          <p>Loading catalog items...</p>
        ) : catalogError ? (
          <p style={{ color: "crimson" }}>{catalogError}</p>
        ) : catalogItems.length === 0 ? (
          <p>No catalog items available.</p>
        ) : (
          <form onSubmit={handleAddItem}>
            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="item-select" style={{ display: "block", marginBottom: "4px" }}>
                Select Item <span style={{ color: "red" }}>*</span>
              </label>
              <select
                id="item-select"
                value={selectedItemId ?? ""}
                onChange={(e) => setSelectedItemId(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              >
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="quantity" style={{ display: "block", marginBottom: "4px" }}>
                Quantity <span style={{ color: "red" }}>*</span>
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                id="is-checked"
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <label htmlFor="is-checked" style={{ cursor: "pointer" }}>
                Mark as checked
              </label>
            </div>

            {submitError ? (
              <div style={{ color: "crimson", marginBottom: "16px", fontSize: "14px" }}>
                {submitError}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                {loading ? "Adding..." : "Add Item"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
