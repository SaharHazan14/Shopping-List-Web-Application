import { useEffect, useMemo, useState } from "react";
import CreateListCard from "../components/CreateListCard";
import UpdateListCard from "../components/UpdateListCard";
import { deleteList, getCurrentUserLists } from "../api/list";
import { getCurrentUser } from "../api/user";
import type { UserList } from "../types/list";
import type { CurrentUser } from "../types/user";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [lists, setLists] = useState<UserList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<UserList | null>(null);
  const [deletingListId, setDeletingListId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchLists = async () => {
    try {
      setListsLoading(true);
      const response = await getCurrentUserLists();
      setLists(response);
    } catch (error) {
      console.error("Failed to fetch lists:", error);
    } finally {
      setListsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      } finally {
        setUserLoading(false);
      }
    }

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchLists();
  }, []);

  const username = useMemo(() => {
    if (!currentUser?.email) return "User";
    const [namePart] = currentUser.email.split("@");
    return namePart || currentUser.email;
  }, [currentUser]);

  const handleDeleteList = async (listId: number, title: string) => {
    const confirmed = window.confirm(`Delete list \"${title}\"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingListId(listId);
      setDeleteError(null);
      await deleteList(listId);
      await fetchLists();
    } catch (error) {
      console.error("Failed to delete list:", error);
      setDeleteError("Failed to delete list.");
    } finally {
      setDeletingListId(null);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Shopping List</h1>
      <p>{userLoading ? "Loading user..." : `Welcome, ${username}`}</p>

      <div style={{ marginBottom: "20px" }}>
        <button type="button" onClick={() => setIsCreateOpen(true)}>
          Create List
        </button>
      </div>

      {isCreateOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000,
          }}
        >
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                zIndex: 1,
              }}
            >
              Close
            </button>
            <CreateListCard
              onCreated={async () => {
                setIsCreateOpen(false);
                await fetchLists();
              }}
            />
          </div>
        </div>
      ) : null}

      <h2>Your Lists</h2>
      {deleteError ? <p style={{ color: "crimson" }}>{deleteError}</p> : null}
      {listsLoading ? <p>Loading lists...</p> : null}
      {!listsLoading && lists.length === 0 ? <p>No lists found.</p> : null}

      {!listsLoading && lists.length > 0 ? (
        <ul style={{ paddingLeft: "20px" }}>
          {lists.map((list) => (
            <li key={list.listId} style={{ marginBottom: "12px" }}>
              <strong>{list.title}</strong>
              <div>{list.description ?? "No description"}</div>
              <div>Creator: {list.creatorEmail}</div>
              <div>
                Items: {list.checkedItems}/{list.totalItems}
              </div>
              <div style={{ marginTop: "8px" }}>
                <button type="button" onClick={() => setEditingList(list)}>
                  Edit Details
                </button>
                <button
                  type="button"
                  style={{ marginLeft: "8px" }}
                  onClick={() => handleDeleteList(list.listId, list.title)}
                  disabled={deletingListId === list.listId}
                >
                  {deletingListId === list.listId ? "Deleting..." : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {editingList ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000,
          }}
        >
          <UpdateListCard
            listId={editingList.listId}
            initialTitle={editingList.title}
            initialDescription={editingList.description}
            onUpdated={async () => {
              setEditingList(null);
              await fetchLists();
            }}
            onCancel={() => setEditingList(null)}
          />
        </div>
      ) : null}
    </div>
  );
}
