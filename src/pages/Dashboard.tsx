import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createList, deleteList, getCurrentUserLists, updateListDetails } from "../api/list";
import { getCurrentUser } from "../api/user";
import type { UserList } from "../types/list";
import type { CurrentUser } from "../types/user";
import AddItemForm from "../components/dashboard/AddItemForm";
import ItemList from "../components/dashboard/ItemList";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [lists, setLists] = useState<UserList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<UserList | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
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

  const handleCreateList = async (name: string) => {
    try {
      setCreateLoading(true);
      setCreateError(null);
      await createList({ title: name });
      await fetchLists();
    } catch (error) {
      console.error("Failed to create list:", error);
      setCreateError("Failed to add item.");
      throw error;
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditDialog = (list: UserList) => {
    setEditingList(list);
    setEditTitle(list.title);
    setEditDescription(list.description ?? "");
    setUpdateError(null);
  };

  const handleUpdateList = async () => {
    if (!editingList) return;

    const payload: { title?: string; description?: string } = {};
    const trimmedTitle = editTitle.trim();
    const trimmedDescription = editDescription.trim();

    if (trimmedTitle) payload.title = trimmedTitle;
    if (trimmedDescription) payload.description = trimmedDescription;

    if (!payload.title && !payload.description) {
      setUpdateError("Provide at least one field: title or description.");
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateError(null);
      await updateListDetails(editingList.listId, payload);
      setEditingList(null);
      await fetchLists();
    } catch (error) {
      console.error("Failed to update list:", error);
      setUpdateError("Failed to update list.");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shopping List</h1>
            <p className="mt-1 text-sm text-slate-500">
              {userLoading ? "Loading user..." : `Welcome back, ${username}`}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/items")}>View Items Catalog</Button>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
            <CardDescription>Create a new shopping list entry quickly.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddItemForm onAdd={handleCreateList} loading={createLoading} />
            {createError ? <p className="mt-3 text-sm text-red-600">{createError}</p> : null}
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Your Lists</h2>
            <Button variant="secondary" onClick={() => setIsCreateOpen(true)}>Advanced Create</Button>
          </div>

          {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}

          {listsLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-slate-500">Loading lists...</CardContent>
            </Card>
          ) : (
            <ItemList
              lists={lists}
              deletingListId={deletingListId}
              onOpen={(listId) => navigate(`/lists/${listId}`)}
              onEdit={openEditDialog}
              onDelete={(list) => handleDeleteList(list.listId, list.title)}
            />
          )}
        </section>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create List</DialogTitle>
            <DialogDescription>Add a title and optional description for your new list.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              await handleCreateList(editTitle.trim() || "Untitled List");
              setIsCreateOpen(false);
            }}
          >
            <Input
              placeholder="List title"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>{createLoading ? "Creating..." : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingList)} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
            <DialogDescription>Update list title or description.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              disabled={updateLoading}
            />
            <Input
              placeholder="Description"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              disabled={updateLoading}
            />
            {updateError ? <p className="text-sm text-red-600">{updateError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingList(null)} disabled={updateLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateList} disabled={updateLoading}>
              {updateLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
