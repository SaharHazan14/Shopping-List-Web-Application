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

  useEffect(() => {
    async function fetchData() {
      try {
        const me = await apiFetch<User>("/user/me");
        const myLists = await apiFetch<ShoppingList[]>("/list?includeMember=true");

        setUser(me);

        // Backend returns lists with { listId, title, description, creatorId, totalItems, checkedItems }
        setLists(myLists || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Welcome{user ? `, ${user.email}` : ""}!</h1>
        <p style={{ color: "#666", marginTop: 6 }}>Here are your shopping lists.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
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
                padding: 16,
                borderRadius: 8,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 120ms ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateY(-4px)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateY(0px)")}
            >
              <h3 style={{ margin: "0 0 8px 0" }}>{list.title}</h3>
              <p style={{ margin: "0 0 12px 0", color: "#444" }}>{list.description ?? "No description"}</p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <small style={{ color: "#666" }}>Owner: {ownerEmail}</small>
                <small style={{ color: "#666" }}>{checked}/{total} checked</small>
              </div>

              <ProgressBar percent={percent} />
            </div>
          );
        })}
      </div>
    </div>
  );
}