import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ShoppingCart, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createList, getCurrentUserLists, updateListDetails } from "../api/list";
import { getCurrentUser } from "../api/user";
import type { UserList } from "../types/list";
import type { CurrentUser } from "../types/user";
import ItemList from "../components/dashboard/ItemList";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [lists, setLists] = useState<UserList[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<UserList | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

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

  const ownedLists = useMemo(() => {
    if (!currentUser?.email) return [];

    return lists.filter(
      (list) => list.creatorEmail.toLowerCase() === currentUser.email.toLowerCase(),
    );
  }, [currentUser?.email, lists]);

  const sharedLists = useMemo(() => {
    if (!currentUser?.email) return lists;

    return lists.filter(
      (list) => list.creatorEmail.toLowerCase() !== currentUser.email.toLowerCase(),
    );
  }, [currentUser?.email, lists]);

  const handleCreateList = async () => {
    const trimmedTitle = createTitle.trim();
    const trimmedDescription = createDescription.trim();

    if (trimmedTitle.length < 2) {
      setCreateError("Title must be at least 2 characters.");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      await createList({
        title: trimmedTitle,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      });
      setCreateTitle("");
      setCreateDescription("");
      setIsCreateOpen(false);
      await fetchLists();
    } catch (error) {
      console.error("Failed to create list:", error);
      setCreateError("Failed to create list.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setCreateTitle("");
      setCreateDescription("");
      setCreateError(null);
    }
  };

  const canCreateList = createTitle.trim().length >= 2;
  const canUpdateList = editTitle.trim().length >= 2;

  const handleUpdateList = async () => {
    if (!editingList) return;

    const payload: { title?: string; description?: string } = {};
    const trimmedTitle = editTitle.trim();
    const trimmedDescription = editDescription.trim();

    if (trimmedTitle.length < 2) {
      setUpdateError("Title must be at least 2 characters.");
      return;
    }

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

      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;

        if (typeof responseData === "string") {
          setUpdateError(responseData);
        } else if (
          responseData &&
          typeof responseData === "object" &&
          "message" in responseData &&
          typeof responseData.message === "string"
        ) {
          setUpdateError(responseData.message);
        } else {
          setUpdateError(error.message || "Failed to update list.");
        }
      } else if (error instanceof Error) {
        setUpdateError(error.message);
      } else {
        setUpdateError("Failed to update list.");
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="inline-flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
                <ShoppingCart className="h-7 w-7 text-emerald-600" />
                SyncCart
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-700">
                Plan together. Shop smarter.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
                >
                  <span>{userLoading ? "..." : username}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-200 px-3 py-2">
                      <p className="text-xs font-medium text-slate-500">Logged in as</p>
                      <p className="text-sm font-semibold text-slate-900">{currentUser?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem("authToken");
                        navigate("/");
                      }}
                      className="inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 active:bg-red-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-8">
          {listsLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-slate-500">Loading lists...</CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">My Lists</h2>
                    <p className="mt-1 text-sm text-slate-500">Lists you own and can fully manage.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => navigate("/items")}
                      className="bg-amber-500 font-semibold text-white hover:bg-amber-600"
                    >
                      View Items Catalog
                    </Button>
                    <Button
                      onClick={() => setIsCreateOpen(true)}
                      className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                    >
                      Create New List
                    </Button>
                  </div>
                </div>
                <ItemList
                  lists={ownedLists}
                  emptyTitle="No lists created yet"
                  emptyDescription="Create your first list to start organizing your shopping items."
                  onOpen={(listId) => navigate(`/lists/${listId}`)}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Shared With Me</h2>
                  <p className="mt-1 text-sm text-slate-500">Lists other collaborators shared with your account.</p>
                </div>
                <ItemList
                  lists={sharedLists}
                  emptyTitle="No shared lists yet"
                  emptyDescription="When someone shares a list with you, it will appear here."
                  onOpen={(listId) => navigate(`/lists/${listId}`)}
                />
              </div>
            </>
          )}
        </section>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create List</DialogTitle>
            <DialogDescription>Add a title and optional description for your new list.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateList();
            }}
          >
            <Input
              placeholder="List title"
              value={createTitle}
              onChange={(event) => setCreateTitle(event.target.value)}
              disabled={createLoading}
            />
            <Input
              placeholder="Description (optional)"
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              disabled={createLoading}
            />
            {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
            <DialogFooter>
              <Button
                type="submit"
                disabled={createLoading || !canCreateList}
                className="min-w-32 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
              >
                {createLoading ? "Creating..." : "Create List"}
              </Button>
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
            <Button
              onClick={handleUpdateList}
              disabled={updateLoading || !canUpdateList}
              className="min-w-32 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
            >
              {updateLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
