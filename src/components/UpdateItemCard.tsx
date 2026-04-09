import { type ComponentProps, useState } from "react";
import { updateItem } from "../api/item";
import type { UpdateItemPayload, ItemCategory, Item } from "../types/item";
import { ItemCategory as ItemCategoryEnum } from "../types/item";
import axios from "axios";

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

  const handleUpdateItem: NonNullable<ComponentProps<"form">["onSubmit"]> = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate that at least one field is provided
    const nameChanged = name.trim() !== item.name;
    const categoryChanged = category !== item.category;

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
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Edit Item</h2>
        <form onSubmit={handleUpdateItem}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="item-name" style={{ display: "block", marginBottom: "4px" }}>
              Item Name
            </label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tomatoes"
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

          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="item-category" style={{ display: "block", marginBottom: "4px" }}>
              Category
            </label>
            <select
              id="item-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            >
              {Object.entries(ItemCategoryEnum).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div style={{ color: "crimson", marginBottom: "16px", fontSize: "14px" }}>
              {error}
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
              {loading ? "Updating..." : "Update Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
