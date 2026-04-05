import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface ItemDTO {
  id: number;
  name: string;
  category: string;
  imageUrl?: string | null;
  creatorId?: number | null;
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("VEGETABLES");
  const [newImageUrl, setNewImageUrl] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [me, setMe] = useState<{ id?: number; email?: string } | null>(null);
  const [rowLoading, setRowLoading] = useState<Record<number, boolean>>({});
  const [editingItem, setEditingItem] = useState<ItemDTO | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<string>("VEGETABLES");
  const [editImageUrl, setEditImageUrl] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    async function fetchItems() {
      setLoading(true);
      try {
        const [resp, meResp] = await Promise.all([
          apiFetch<ItemDTO[]>('/item?global=true', { signal: controller.signal }),
          apiFetch<{ id?: number; email?: string }>('/user/me', { signal: controller.signal }).catch(() => null),
        ]);
        if (!mounted) return;
        setItems((resp as ItemDTO[] )|| []);
        setMe(meResp || null);
        setError(null);
      } catch (err: any) {
        if (err && (err.name === 'AbortError' || err.message?.includes('The user aborted a request'))) {
          return;
        }
        console.error("[ItemsPage] failed to load items:", err);
        if (!mounted) return;
        setError(err.message || "Failed to load items");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchItems();
    return () => { mounted = false; controller.abort(); };
  }, []);

  if (loading) return <p>Loading items...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const globalItems = items.filter(i => i.creatorId == null);
  const customItems = items.filter(i => i.creatorId != null);

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Available Items</h2>
        <div>
          <button onClick={() => setShowAddModal(true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>+ New Item</button>
        </div>
      </div>

      <section style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 8 }}>Global items</h3>
        {globalItems.length === 0 ? <p style={{ color: '#64748b' }}>No global items found.</p> : (
          <div style={{ display: 'grid', gap: 10 }}>
            {globalItems.map(it => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'white', borderRadius: 10, boxShadow: '0 6px 18px rgba(2,6,23,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {it.imageUrl ? <img src={it.imageUrl} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ fontSize: 18, color: '#94a3b8' }}>🍎</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, color: '#0f172a' }}>{it.name}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{it.category}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#ecf2ff', color: '#0f172a', padding: '6px 10px', borderRadius: 999, fontSize: 12 }}>Global</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <h3 style={{ marginBottom: 8 }}>Your custom items</h3>
        {customItems.length === 0 ? <p style={{ color: '#64748b' }}>You don't have any custom items yet.</p> : (
          <div style={{ display: 'grid', gap: 10 }}>
            {customItems.map(it => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'white', borderRadius: 10, boxShadow: '0 6px 18px rgba(2,6,23,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {it.imageUrl ? <img src={it.imageUrl} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ fontSize: 18, color: '#f59e0b' }}>★</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, color: '#0f172a' }}>{it.name}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{it.category}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#fff7ed', color: '#92400e', padding: '6px 10px', borderRadius: 999, fontSize: 12 }}>Custom</div>
                  {/* Edit/Delete only for items created by current user */}
                  {me && it.creatorId && me.id === it.creatorId && (
                    <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
                      <button onClick={() => {
                        setEditingItem(it);
                        setEditName(it.name);
                        setEditCategory(it.category);
                        setEditImageUrl(it.imageUrl ?? '');
                      }} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #e6eaf0', background: 'transparent', cursor: 'pointer' }}>Edit</button>

                      <button onClick={async () => {
                        if (!confirm('Delete this custom item?')) return;
                        const idNum = Number(it.id);
                        if (Number.isNaN(idNum)) {
                          alert('Invalid item id');
                          return;
                        }
                        setRowLoading(s => ({ ...s, [idNum]: true }));
                        try {
                          await apiFetch(`/item/${idNum}`, { method: 'DELETE' });
                          const resp = await apiFetch<ItemDTO[]>('/item?global=true');
                          setItems(resp || []);
                        } catch (err: any) {
                          console.error('[ItemsPage] failed to delete item', err);
                          alert('Failed to delete item: ' + (err.message || 'unknown'));
                        } finally {
                          setRowLoading(s => ({ ...s, [idNum]: false }));
                        }
                      }} disabled={!!rowLoading[it.id]} style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>{rowLoading[it.id] ? 'Deleting...' : 'Delete'}</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
          <div style={{ background: 'white', width: '92%', maxWidth: 520, borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Add New Item</h3>
              <button onClick={() => setShowAddModal(false)}>Close</button>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <label>
                <div style={{ fontSize: 12, color: '#444' }}>Name *</div>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </label>

              <label>
                <div style={{ fontSize: 12, color: '#444' }}>Category *</div>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: '100%', padding: 8 }}>
                  <option value="VEGETABLES">VEGETABLES</option>
                  <option value="FRUITS">FRUITS</option>
                  <option value="DAIRY">DAIRY</option>
                  <option value="MEAT">MEAT</option>
                  <option value="DRINKS">DRINKS</option>
                  <option value="CLEANING">CLEANING</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </label>

              <label>
                <div style={{ fontSize: 12, color: '#444' }}>Image URL (optional)</div>
                <input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: 8 }} />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setShowAddModal(false)} disabled={adding}>Cancel</button>
                <button onClick={async () => {
                  // validation
                  const allowed = ["VEGETABLES","FRUITS","DAIRY","MEAT","DRINKS","CLEANING","OTHER"];
                  if (!newName.trim()) { alert('Name is required'); return; }
                  if (!allowed.includes(newCategory)) { alert('Invalid category'); return; }
                  setAdding(true);
                  try {
                    const body: any = { name: newName.trim(), category: newCategory };
                    if (newImageUrl.trim()) body.imageUrl = newImageUrl.trim();
                    await apiFetch('/item', { method: 'POST', body: JSON.stringify(body) });
                    // refresh list
                    const resp = await apiFetch<ItemDTO[]>('/item?global=true');
                    setItems(resp || []);
                    setShowAddModal(false);
                    setNewName(''); setNewCategory('VEGETABLES'); setNewImageUrl('');
                  } catch (err: any) {
                    console.error('[ItemsPage] failed to add item', err);
                    alert('Failed to add item: ' + (err.message || 'unknown'));
                  } finally { setAdding(false); }
                }} disabled={adding} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>{adding ? 'Adding...' : 'Add Item'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }}>
          <div style={{ background: 'white', width: '92%', maxWidth: 520, borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Edit Item</h3>
              <button onClick={() => setEditingItem(null)}>Close</button>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <label>
                <div style={{ fontSize: 12, color: '#444' }}>Name</div>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </label>

              <label>
                <div style={{ fontSize: 12, color: '#444' }}>Category</div>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ width: '100%', padding: 8 }}>
                  <option value="VEGETABLES">VEGETABLES</option>
                  <option value="FRUITS">FRUITS</option>
                  <option value="DAIRY">DAIRY</option>
                  <option value="MEAT">MEAT</option>
                  <option value="DRINKS">DRINKS</option>
                  <option value="CLEANING">CLEANING</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </label>

              <label>
                <div style={{ fontSize: 12, color: '#444' }}>Image URL</div>
                <input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: 8 }} />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setEditingItem(null)} disabled={savingEdit}>Cancel</button>
                <button onClick={async () => {
                  if (!editingItem) return;
                  // build patch body with only fields that changed
                  const body: any = {};
                  if (editName.trim() && editName.trim() !== editingItem.name) body.name = editName.trim();
                  if (editCategory && editCategory !== editingItem.category) body.category = editCategory;
                  if ((editImageUrl || '') !== (editingItem.imageUrl || '')) body.imageUrl = editImageUrl || null;
                  if (Object.keys(body).length === 0) { setEditingItem(null); return; }
                  const idNum = Number(editingItem.id);
                  if (Number.isNaN(idNum)) { alert('Invalid item id'); return; }
                  setSavingEdit(true);
                  setRowLoading(s => ({ ...s, [idNum]: true }));
                  try {
                    await apiFetch(`/item/${idNum}`, { method: 'PATCH', body: JSON.stringify(body) });
                    const resp = await apiFetch<ItemDTO[]>('/item?global=true');
                    setItems(resp || []);
                    setEditingItem(null);
                  } catch (err: any) {
                    console.error('[ItemsPage] failed to save item edit', err);
                    alert('Failed to save item: ' + (err.message || 'unknown'));
                  } finally {
                    setSavingEdit(false);
                    setRowLoading(s => ({ ...s, [idNum]: false }));
                  }
                }} disabled={savingEdit} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>{savingEdit ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

