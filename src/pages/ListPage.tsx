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

interface ListDetails {
  listId: number;
  title: string;
  description?: string | null;
  creatorEmail?: string | null;
  creatorId?: number | null;
  totalItems?: number;
  checkedItems?: number;
}

interface ListMember {
  listId: number;
  memberId: number;
  role: string; // Role enum from backend
  email: string;
}

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ListItemResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowLoading, setRowLoading] = useState<Record<number, boolean>>({});

  const [details, setDetails] = useState<ListDetails | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [members, setMembers] = useState<ListMember[]>([]);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [updatingMember, setUpdatingMember] = useState<Record<number, boolean>>({});
  const [deletingMember, setDeletingMember] = useState<Record<number, boolean>>({});

  // close modal on Escape
  useEffect(() => {
    if (!showMembersPanel) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowMembersPanel(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showMembersPanel]);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      if (!listId) {
        setError("Missing list id");
        setLoading(false);
        return;
      }

      try {
        const [respItems, respDetails, me, respMembers] = await Promise.all([
          apiFetch<ListItemResponseDTO[]>(`/list/${listId}/item`),
          apiFetch<ListDetails>(`/list/${listId}`),
          apiFetch<{ id?: number; email?: string }>("/user/me").catch(() => null),
          apiFetch<ListMember[]>(`/list/${listId}/member`).catch(() => []),
        ]);

        if (!mounted) return;
        setItems(respItems || []);
        // normalize creator email / id: backend may return `creatorEmail`, nested `creator.email`, or `creatorId`
        if (respDetails) {
          const anyDetails: any = respDetails as any;
          const normalizedCreatorEmail = respDetails.creatorEmail ?? anyDetails.creator?.email ?? anyDetails.creator_email ?? null;
          const normalizedCreatorId = (respDetails as any).creatorId ?? anyDetails.creator?.id ?? anyDetails.creator_id ?? null;
          const normalized = { ...respDetails, creatorEmail: normalizedCreatorEmail, creatorId: normalizedCreatorId } as ListDetails;
          setDetails(normalized);
        } else {
          setDetails(null);
        }
        setUserEmail(me?.email ?? null);
        setUserId(me?.id ?? null);
        // logs: print the raw responses so we can inspect ListDetails & members shape
        console.info('[ListPage] respItems:', respItems);
        console.info('[ListPage] respDetails:', respDetails);
        console.info('[ListPage] /user/me:', me);
        console.info('[ListPage] respMembers:', respMembers);
        setEditTitle(respDetails?.title ?? ((location.state as any)?.title ?? `List ${listId}`));
        setEditDescription(respDetails?.description ?? "");
        setMembers(respMembers || []);
      } catch (err: any) {
        console.error("[ListPage] failed to load:", err);
        if (!mounted) return;
        setError(err.message || "Failed to load list");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      mounted = false;
    };
  }, [listId]);

  // PATCH single item: quantity, isChecked
  async function patchItem(itemId: number, patch: { quantity?: number; isChecked?: boolean }) {
    if (!listId) return;
    setRowLoading((s) => ({ ...s, [itemId]: true }));
    try {
      await apiFetch(`/list/${listId}/item/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });

      setItems((prev) => prev.map((it) => (it.itemId === itemId ? { ...it, quantity: patch.quantity ?? it.quantity, isChecked: patch.isChecked ?? it.isChecked } : it)));
    } catch (err: any) {
      console.error("[ListPage] failed to patch item:", err);
      alert("Failed to update item: " + (err.message || "unknown"));
    } finally {
      setRowLoading((s) => ({ ...s, [itemId]: false }));
    }
  }

  async function deleteItem(itemId: number) {
    if (!listId) return;
    const confirmed = window.confirm("Remove this item from the list?");
    if (!confirmed) return;
    setRowLoading((s) => ({ ...s, [itemId]: true }));
    try {
      await apiFetch(`/list/${listId}/item/${itemId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((it) => it.itemId !== itemId));
    } catch (err: any) {
      console.error("[ListPage] failed to delete item:", err);
      alert("Failed to delete item: " + (err.message || "unknown"));
    } finally {
      setRowLoading((s) => ({ ...s, [itemId]: false }));
    }
  }

  async function saveDetails() {
    if (!listId) return;
    const titleTrim = editTitle?.trim();
    const descTrim = editDescription?.trim();
    // require at least one provided
    if (!titleTrim && !descTrim) {
      alert("Please provide a title or description to update the list.");
      return;
    }

    const payload: Record<string, string> = {};
    if (titleTrim) payload.title = titleTrim;
    if (descTrim) payload.description = descTrim;

    try {
      await apiFetch(`/list/${listId}`, { method: "PATCH", body: JSON.stringify(payload) });
      setDetails((d) => (d ? { ...d, title: payload.title ?? d.title, description: payload.description ?? d.description } : d));
      setEditing(false);
    } catch (err: any) {
      console.error("[ListPage] failed to save details:", err);
      alert("Failed to save list details: " + (err.message || "unknown"));
    }
  }

  async function deleteList() {
    if (!listId) return;
    const confirmed = window.confirm("Are you sure you want to delete this list? This cannot be undone.");
    if (!confirmed) return;
    try {
      await apiFetch(`/list/${listId}`, { method: "DELETE" });
      // navigate back to dashboard/lists
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[ListPage] failed to delete list:', err);
      alert('Failed to delete list: ' + (err.message || 'unknown'));
    }
  }

  

  if (loading) return <p>Loading list...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const isOwner = (() => {
    if (!details) return false;
    // primary check: numeric creatorId match
    if (details.creatorId != null && userId != null) {
      try {
        if (Number(details.creatorId) === Number(userId)) return true;
      } catch (e) {
        // ignore and fall back to email
      }
    }
    // fallback: email comparison (trim & lowercase)
    if (details.creatorEmail && userEmail) {
      if (details.creatorEmail.trim().toLowerCase() === userEmail.trim().toLowerCase()) return true;
    }
    return false;
  })();

  const title = details?.title ?? (location.state as any)?.title ?? `List ${listId}`;
  const description = details?.description ?? "";
  const total = details?.totalItems ?? items.length;
  const checked = details?.checkedItems ?? items.filter((i) => i.isChecked).length;
  const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div style={{ padding: 28, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>← Back to lists</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>Owned</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>{details?.creatorEmail ?? ''}</div>
          </div>

          {/* collaborators tab (opens modal) */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowMembersPanel(true)}
              aria-expanded={showMembersPanel}
              style={{
                background: '#f1f5f9',
                border: '1px solid #e6eef6',
                padding: '8px 12px',
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: 600,
                color: '#0f172a'
              }}
            >
              Collaborators ({members.length})
            </button>
          </div>

          {/* Collaborators modal */}
          {showMembersPanel && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={() => setShowMembersPanel(false)}>
              <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ background: 'white', width: '90%', maxWidth: 520, borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Collaborators ({members.length})</h3>
                  <button onClick={() => setShowMembersPanel(false)} aria-label="Close collaborators">Close</button>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  {members.length === 0 && <div style={{ color: '#64748b' }}>No collaborators</div>}
                  {members.map((m) => (
                    <div key={m.memberId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderRadius: 8, border: '1px solid #eef2ff', background: '#fff' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 14, color: '#0f172a' }}>{m.email}{(userEmail && userEmail === m.email) || (userId && userId === m.memberId) ? ' (You)' : ''}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{m.role}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isOwner && !((userId && userId === m.memberId) || (userEmail && userEmail === m.email)) ? (
                          <>
                            <select
                              aria-label={`Change role for ${m.email}`}
                              value={m.role}
                              onChange={async (e) => {
                                const newRole = e.target.value as string;
                                if (!listId) return;
                                if (!confirm(`Change role of ${m.email} to ${newRole}?`)) {
                                  // revert selection by forcing state refresh
                                  setMembers((prev) => prev.map(pm => pm.memberId === m.memberId ? { ...pm } : pm));
                                  return;
                                }
                                setUpdatingMember((s) => ({ ...s, [m.memberId]: true }));
                                try {
                                  await apiFetch(`/list/${listId}/member/${m.memberId}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ role: newRole }),
                                  });
                                  setMembers((prev) => prev.map(pm => (pm.memberId === m.memberId ? { ...pm, role: newRole } : pm)));
                                } catch (err: any) {
                                  console.error('[ListPage] failed to change member role:', err);
                                  alert('Failed to change role: ' + (err.message || 'unknown'));
                                } finally {
                                  setUpdatingMember((s) => ({ ...s, [m.memberId]: false }));
                                }
                              }}
                              disabled={!!updatingMember[m.memberId] || !!deletingMember[m.memberId]}
                            >
                              <option value="EDITOR">EDITOR</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>

                            <button
                              onClick={async () => {
                                if (!listId) return;
                                if (!confirm(`Remove collaborator ${m.email} from this list?`)) return;
                                setDeletingMember((s) => ({ ...s, [m.memberId]: true }));
                                try {
                                  await apiFetch(`/list/${listId}/member/${m.memberId}`, { method: 'DELETE' });
                                  setMembers((prev) => prev.filter(pm => pm.memberId !== m.memberId));
                                } catch (err: any) {
                                  console.error('[ListPage] failed to delete member:', err);
                                  alert('Failed to remove collaborator: ' + (err.message || 'unknown'));
                                } finally {
                                  setDeletingMember((s) => ({ ...s, [m.memberId]: false }));
                                }
                              }}
                              disabled={!!updatingMember[m.memberId] || !!deletingMember[m.memberId]}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              title={`Remove ${m.email}`}
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <div style={{ fontSize: 13, color: '#0f172a' }}>{m.role}{(userEmail && userEmail === m.email) || (userId && userId === m.memberId) ? ' (You)' : ''}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <h1 style={{ margin: '6px 0', fontSize: 32, color: '#0f172a' }}>{title}</h1>
          <div style={{ color: '#6b7280', marginBottom: 18 }}>{description}</div>

          <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 8px 20px rgba(2,6,23,0.04)', maxWidth: 700 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{checked}/{total} items</div>
              <div style={{ color: '#94a3b8' }}>{percent}% complete</div>
            </div>
            <div style={{ height: 12, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: '#10b981' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          {isOwner && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button title="Edit list" onClick={() => setEditing(true)} style={{ background: 'transparent', border: '1px solid #e6eaf0', padding: 8, borderRadius: 8, cursor: 'pointer' }}>✎</button>
              <button title="Delete list" onClick={() => deleteList()} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.12)', padding: 8, borderRadius: 8, cursor: 'pointer', color: '#ef4444' }}>🗑️</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          {items.map((it) => (
            <li key={it.itemId} style={{ background: 'white', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" checked={!!it.isChecked} onChange={(e) => { const checked = e.target.checked; setItems((prev) => prev.map(p => p.itemId===it.itemId?{...p,isChecked:checked}:p)); patchItem(it.itemId,{isChecked:checked}); }} />
                <div>
                  <div style={{ fontSize: 16, color: '#0f172a' }}>{it.itemName}</div>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>Quantity: {it.quantity}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" min={1} value={it.quantity} onChange={(e)=>{ const val=Math.max(1,Number(e.target.value)||1); setItems((prev)=>prev.map(p=>p.itemId===it.itemId?{...p,quantity:val}:p)); }} onBlur={(e)=>{ const val=Math.max(1,Number(e.target.value)||1); if(!rowLoading[it.itemId]) patchItem(it.itemId,{quantity:val}); }} style={{ width: 80 }} />
                <button onClick={()=>deleteItem(it.itemId)} disabled={!!rowLoading[it.itemId]} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', width: '90%', maxWidth: 600, borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Edit List</h3>
              <button onClick={()=>setEditing(false)}>Close</button>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <label>
                <div style={{ fontSize: 12, color: '#444' }}>Title</div>
                <input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </label>

              <label>
                <div style={{ fontSize: 12, color: '#444' }}>Description</div>
                <textarea value={editDescription} onChange={(e)=>setEditDescription(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={()=>setEditing(false)}>Cancel</button>
                <button onClick={saveDetails}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
