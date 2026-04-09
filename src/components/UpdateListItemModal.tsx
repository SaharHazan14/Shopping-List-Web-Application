import { type ComponentProps, useState } from "react";
import { updateListItem } from "../api/list";
import type { ListItem, UpdateListItemPayload } from "../types/list";
import axios from "axios";

interface UpdateListItemModalProps {
  listId: number;
  item: ListItem;
  onUpdated: () => void;
  onCancel: () => void;
}

export default function UpdateListItemModal({
  listId,
  item,
  onUpdated,
  onCancel,
}: UpdateListItemModalProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isChecked, setIsChecked] = useState(item.isChecked);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdateItem: NonNullable<ComponentProps<"form">["onSubmit"]> = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate that at least one field is provided
    const quantityChanged = quantity !== item.quantity;
    const isCheckedChanged = isChecked !== item.isChecked;

    if (!quantityChanged && !isCheckedChanged) {
      setError("Provide at least one field: quantity or isChecked.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    try {
      setLoading(true);
      const payload: UpdateListItemPayload = {};
      if (quantityChanged) payload.quantity = quantity;
      if (isCheckedChanged) payload.isChecked = isChecked;

      await updateListItem(listId, item.itemId, payload);
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
        <h2 style={{ marginTop: 0 }}>Edit Item: {item.itemName}</h2>
        <form onSubmit={handleUpdateItem}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="quantity" style={{ display: "block", marginBottom: "4px" }}>
              Quantity
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
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
