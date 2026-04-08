import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getListById } from "../api/list";
import type { ListDetails } from "../types/list";

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const [list, setList] = useState<ListDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        </>
      ) : null}
    </div>
  );
}
