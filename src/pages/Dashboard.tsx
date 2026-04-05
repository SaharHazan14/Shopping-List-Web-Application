import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

interface User {
  id: number;
  cognitoSub?: string;
  email: string;
}

interface ShoppingList {
  listId: number;
  title: string;
  description?: string | null;
  // backend now returns creatorEmail instead of creatorId
  creatorEmail?: string | null;
  totalItems: number;
  checkedItems: number;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div style={{ height: 10, background: "#e6e6e6", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${percent}%`, height: "100%", background: "#4caf50" }} />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function fetchLists(signal?: AbortSignal) {
    setLoading(true);
    try {
      const me = await apiFetch<User>("/user/me", { signal });
      const myLists = await apiFetch<ShoppingList[]>("/list?includeMember=true", { signal });
      console.log("[Dashboard] fetched lists:", myLists);
      setUser(me);
      setLists(myLists || []);
      setError(null);
    } catch (err: any) {
      if (err && (err.name === 'AbortError' || err.message?.includes('The user aborted a request'))) {
        return;
      }
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchLists(controller.signal);
    return () => controller.abort();
  }, []);

  async function createList() {
    if (!newTitle.trim()) {
      alert("Title is required");
      return;
    }

    setCreating(true);
    try {
      await apiFetch('/list', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), description: newDescription || undefined }),
      });

      // refresh lists
      await fetchLists();
      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
    } catch (err: any) {
      console.error('[Dashboard] failed to create list:', err);
      alert('Failed to create list: ' + (err.message || 'unknown'));
    } finally {
      setCreating(false);
    }
  }

  

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const shortName = user?.email ? user.email.split("@")[0].replace(/\.|\d+/g, " ") : "";
  const capitalized = (shortName || "").split(" ").map(s => s ? s[0].toUpperCase()+s.slice(1) : "").join(" ");

  return (
    <div style={{ padding: 28, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#6b7280', marginBottom: 8 }}>SHOPPING LISTS</div>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.05, color: '#0f172a' }}>Good evening{user ? `, ${capitalized}` : ''}</h1>
          <div style={{ color: '#6b7280', marginTop: 8 }}>You have <strong style={{ color: '#0f172a' }}>{lists.length}</strong> lists to manage</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setShowCreateModal(true)}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(16,185,129,0.12)'
            }}
          >
            + New List
          </button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {lists.map((list) => {
          const total = list.totalItems ?? 0;
          const checked = list.checkedItems ?? 0;
          const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
          const ownerEmail = list.creatorEmail
            ? (user && list.creatorEmail === user.email ? "You" : list.creatorEmail)
            : "-";

          return (
            <div
              role="button"
              onClick={() => navigate(`/list/${list.listId}`, { state: { title: list.title } })}
              key={list.listId}
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
                cursor: "pointer",
                transition: "transform 160ms ease, box-shadow 160ms ease",
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 180
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(2,6,23,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(2,6,23,0.06)";
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ display: 'inline-block', background: '#ecfdf5', color: '#065f46', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Owned</div>
                  <h3 style={{ margin: '6px 0 8px 0', fontSize: 20, color: '#0f172a' }}>{list.title}</h3>
                  <div style={{ color: '#475569', fontSize: 14 }}>{list.description ?? 'No description'}</div>
                </div>

                <div style={{ color: '#94a3b8', fontSize: 12 }}>{/* placeholder for time */}</div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{checked}/{total}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{percent}%</div>
                </div>

                <div style={{ height: 10, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: '#10b981' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, color: '#64748b', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 9, background: '#eef2ff', display: 'inline-block' }} />
                    <div>Created by {ownerEmail}</div>
                  </div>
                  <div />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", width: "90%", maxWidth: 600, borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Create New List</h3>
              <button onClick={() => setShowCreateModal(false)}>Close</button>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label>
                <div style={{ fontSize: 12, color: '#444' }}>Title *</div>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </label>

              <label>
                <div style={{ fontSize: 12, color: '#444' }}>Description</div>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setShowCreateModal(false)} disabled={creating}>Cancel</button>
                <button onClick={createList} disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create List Modal markup is rendered conditionally inside the component