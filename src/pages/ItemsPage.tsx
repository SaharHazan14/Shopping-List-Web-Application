import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllItems, deleteItem } from "../api/item";
import type { Item } from "../types/item";
import CreateItemCard from "../components/CreateItemCard";
import UpdateItemCard from "../components/UpdateItemCard";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllItems();
      setItems(response);
    } catch (fetchError) {
      console.error("Failed to fetch items:", fetchError);
      setError("Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleItemCreated = () => {
    setShowCreateModal(false);
    fetchItems();
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      setDeleteLoading(true);
      await deleteItem(itemId);
      setDeletingItemId(null);
      fetchItems();
    } catch (err) {
      console.error("Failed to delete item:", err);
      setError("Failed to delete item.");
      setDeletingItemId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <p>
        <Link to="/dashboard">← Back to dashboard</Link>
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>All Items</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          + Create Item
        </button>
      </div>

      {loading ? <p>Loading items...</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {!loading && !error && items.length === 0 ? <p>No items found.</p> : null}

      {!loading && !error && items.length > 0 ? (
        <ul style={{ paddingLeft: "20px" }}>
          {items.map((item) => (
            <li key={item.id} style={{ marginBottom: "12px" }}>
              <strong>{item.name}</strong>
              <div>Category: {item.category}</div>
              <div>{item.creatorId === null ? "Global item" : `Creator ID: ${item.creatorId}`}</div>
              <div>{item.imageUrl ? item.imageUrl : "No image"}</div>
              {item.creatorId !== null ? (
                <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setEditingItem(item)}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingItemId(item.id)}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {showCreateModal ? (
        <CreateItemCard
          onCreated={handleItemCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      ) : null}

      {editingItem ? (
        <UpdateItemCard
          item={editingItem}
          onUpdated={() => {
            setEditingItem(null);
            fetchItems();
          }}
          onCancel={() => setEditingItem(null)}
        />
      ) : null}

      {deletingItemId !== null ? (
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
          onClick={() => setDeletingItemId(null)}
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
            <h2 style={{ marginTop: 0 }}>Delete Item?</h2>
            <p>Are you sure you want to delete this item? This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeletingItemId(null)}
                disabled={deleteLoading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deletingItemId)}
                disabled={deleteLoading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
