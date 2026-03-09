import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

interface ListItemResponseDTO {
  listId: number;
  itemId: number;
  itemName?: string;
  quantity: number;
  isChecked: boolean;
}

interface AvailableItem {
  id: number;
  name: string;
  category: string;
  imageUrl?: string | null;
  creatorId?: number | null;
}

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ListItemResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [rowLoading, setRowLoading] = useState<Record<number, boolean>>({});
  const [availableQuantities, setAvailableQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    let mounted = true;
    async function fetchItems() {
      if (!listId) {
        setError("Missing list id");
        setLoading(false);
        return;
      }

      try {
        const resp = await apiFetch<ListItemResponseDTO[]>(`/list/${listId}/item`);
        if (!mounted) return;
        setItems(resp || []);
      } catch (err: any) {
        console.error("[ListPage] failed to load items:", err);
        if (!mounted) return;
        setError(err.message || "Failed to load items");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchItems();
    return () => {
      mounted = false;
    };
  }, [listId]);

  async function openAddModal() {
    setShowAddModal(true);
    setLoadingAvailable(true);
    try {
      const items = await apiFetch<AvailableItem[]>("/item?global=true");
      setAvailableItems(items || []);
      // initialize quantities to 1 for each item
      const initial: Record<number, number> = {};
      (items || []).forEach((it) => (initial[it.id] = 1));
      setAvailableQuantities(initial);
    } catch (err: any) {
      console.error("[ListPage] failed to load available items:", err);
    } finally {
      setLoadingAvailable(false);
    }
  }

  async function handleAdd(itemId: number, quantity = 1) {
    if (!listId) return;
    setAddingItemId(itemId);
    try {
      // Attempt to add the item to the list. Backend expected endpoint assumed as POST /list/:listId/item
      await apiFetch(`/list/${listId}/item`, {
        method: "POST",
        body: JSON.stringify({ itemId, quantity, isChecked: false }),
      });

      // refresh items on success
      const resp = await apiFetch<ListItemResponseDTO[]>(`/list/${listId}/item`);
      setItems(resp || []);
      setShowAddModal(false);
    } catch (err: any) {
      console.error("[ListPage] failed to add item:", err);
      alert("Failed to add item: " + (err.message || "unknown"));
    } finally {
      setAddingItemId(null);
    }
  }

  // PATCH single item: quantity, isChecked
  async function patchItem(itemId: number, patch: { quantity?: number; isChecked?: boolean }) {
    if (!listId) return;
    setRowLoading((s) => ({ ...s, [itemId]: true }));
    try {
      await apiFetch(`/list/${listId}/item/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });

      // update local state for the item
      setItems((prev) =>
        prev.map((it) => (it.itemId === itemId ? { ...it, quantity: patch.quantity ?? it.quantity, isChecked: patch.isChecked ?? it.isChecked } : it))
      );
    } catch (err: any) {
      console.error("[ListPage] failed to patch item:", err);
      alert("Failed to update item: " + (err.message || "unknown"));
    } finally {
      setRowLoading((s) => ({ ...s, [itemId]: false }));
    }
  }

  const title = (location.state as any)?.title ?? `List ${listId}`;

  if (loading) return <p>Loading items...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={() => navigate(-1)} style={{}}>
          ← Back
        </button>

        <div>
          <button onClick={() => openAddModal()} style={{ marginLeft: 8 }}>
            + Add New Item
          </button>
        </div>
      </div>

      <h2 style={{ marginTop: 0 }}>{title}</h2>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Quantity</th>
            <th style={{ padding: 8 }}>Checked</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.itemId} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: 8 }}>{it.itemName ?? "-"}</td>
              <td style={{ padding: 8 }}>
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 1);
                    // optimistic local update
                    setItems((prev) => prev.map((p) => (p.itemId === it.itemId ? { ...p, quantity: val } : p)));
                  }}
                  onBlur={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 1);
                    // Always attempt to persist the value on blur. If a patch is
                    // already in-flight for this row, skip to avoid duplicate requests.
                    if (!rowLoading[it.itemId]) {
                      patchItem(it.itemId, { quantity: val });
                    }
                  }}
                  style={{ width: 80 }}
                />
              </td>
              <td style={{ padding: 8 }}>
                <input
                  type="checkbox"
                  checked={!!it.isChecked}
                  disabled={!!rowLoading[it.itemId]}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    // optimistic local update
                    setItems((prev) => prev.map((p) => (p.itemId === it.itemId ? { ...p, isChecked: checked } : p)));
                    patchItem(it.itemId, { isChecked: checked });
                  }}
                />
                {rowLoading[it.itemId] && <span style={{ marginLeft: 8 }}>Saving...</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Item Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", width: "90%", maxWidth: 800, borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Available Items</h3>
              <button onClick={() => setShowAddModal(false)}>Close</button>
            </div>

            {loadingAvailable ? (
              <p>Loading items...</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    <th style={{ padding: 8 }}>Name</th>
                    <th style={{ padding: 8 }}>Category</th>
                    <th style={{ padding: 8 }}>Type</th>
                    <th style={{ padding: 8 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {availableItems.map((it) => (
                    <tr key={it.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: 8 }}>{it.name}</td>
                      <td style={{ padding: 8 }}>{it.category}</td>
                      <td style={{ padding: 8 }}>{it.creatorId == null ? "Global" : "Custom"}</td>
                      <td style={{ padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="number"
                          min={1}
                          value={availableQuantities[it.id] ?? 1}
                          onChange={(e) =>
                            setAvailableQuantities((prev) => ({ ...prev, [it.id]: Math.max(1, Number(e.target.value) || 1) }))
                          }
                          style={{ width: 70 }}
                        />

                        <button onClick={() => handleAdd(it.id, availableQuantities[it.id] ?? 1)} disabled={addingItemId === it.id}>
                          {addingItemId === it.id ? "Adding..." : "Add"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
