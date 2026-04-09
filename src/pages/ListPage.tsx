import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getListById, getListItems, deleteListItem } from "../api/list";
import type { ListDetails, ListItem } from "../types/list";
import AddItemToListModal from "../components/AddItemToListModal";
import UpdateListItemModal from "../components/UpdateListItemModal";

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const [list, setList] = useState<ListDetails | null>(null);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const parsedListId = useMemo(() => {
    if (!listId) return null;
    const value = Number(listId);
    return Number.isFinite(value) ? value : null;
  }, [listId]);

  useEffect(() => {
    async function fetchListDetails() {
      if (parsedListId === null) {
        setError("Invalid list id");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getListById(parsedListId);
        setList(response);
      } catch (fetchError) {
        console.error("Failed to fetch list details:", fetchError);
        setError("Failed to load list details.");
      } finally {
        setLoading(false);
      }
    }

    fetchListDetails();
  }, [parsedListId]);

  const fetchItems = async () => {
    if (parsedListId === null) {
      setItemsError("Invalid list id");
      setItemsLoading(false);
      return;
    }

    try {
      setItemsLoading(true);
      setItemsError(null);
      const response = await getListItems(parsedListId);
      setListItems(response);
    } catch (fetchError) {
      console.error("Failed to fetch list items:", fetchError);
      setItemsError("Failed to load list items.");
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [parsedListId]);

  const handleDeleteItem = async (itemId: number) => {
    if (parsedListId === null) return;
    try {
      setDeleteLoading(true);
      await deleteListItem(parsedListId, itemId);
      setDeletingItemId(null);
      fetchItems();
    } catch (err) {
      console.error("Failed to delete item:", err);
      setItemsError("Failed to delete item.");
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
      <h1>List Details</h1>

      {loading ? <p>Loading list details...</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {!loading && !error && list ? (
        <>
          <h2>{list.title}</h2>
          <p>{list.description ?? "No description"}</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px" }}>
            <h3 style={{ margin: 0 }}>Items</h3>
            <button
              onClick={() => setShowAddItemModal(true)}
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
              + Add Item
            </button>
          </div>
          {itemsLoading ? (
            <p>Loading items...</p>
          ) : itemsError ? (
            <p style={{ color: "crimson" }}>{itemsError}</p>
          ) : listItems.length === 0 ? (
            <p>No items in this list yet.</p>
          ) : (
            <ul style={{ paddingLeft: "20px" }}>
              {listItems.map((item) => (
                <li key={item.itemId} style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      disabled
                      style={{ cursor: "pointer" }}
                    />
                    <span
                      style={{
                        textDecoration: item.isChecked ? "line-through" : "none",
                        color: item.isChecked ? "#999" : "inherit",
                      }}
                    >
                      {item.itemName}
                    </span>
                  </div>
                  <div style={{ marginLeft: "28px", fontSize: "14px", color: "#666" }}>
                    Quantity: {item.quantity}
                  </div>
                  <div style={{ marginLeft: "28px", marginTop: "8px", display: "flex", gap: "8px" }}>
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
                      onClick={() => setDeletingItemId(item.itemId)}
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
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {showAddItemModal && parsedListId !== null ? (
        <AddItemToListModal
          listId={parsedListId}
          onItemAdded={() => {
            setShowAddItemModal(false);
            fetchItems();
          }}
          onCancel={() => setShowAddItemModal(false)}
        />
      ) : null}

      {editingItem && parsedListId !== null ? (
        <UpdateListItemModal
          listId={parsedListId}
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
            <h2 style={{ marginTop: 0 }}>Remove Item?</h2>
            <p>Are you sure you want to remove this item from the list?</p>
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
                {deleteLoading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
