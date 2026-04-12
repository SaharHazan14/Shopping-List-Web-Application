import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Box, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import axios from "axios";
import { getAllItems, deleteItem } from "../api/item";
import { getCurrentUser } from "../api/user";
import type { Item } from "../types/item";
import type { CurrentUser } from "../types/user";
import CreateItemCard from "../components/CreateItemCard";
import UpdateItemCard from "../components/UpdateItemCard";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllItems();
      setItems(response);
    } catch (fetchError) {
      console.error("Failed to fetch items:", fetchError);
      setError("Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    async function fetchCurrentUserProfile() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (fetchError) {
        console.error("Failed to fetch current user:", fetchError);
      }
    }

    void fetchCurrentUserProfile();
  }, []);

  const handleItemCreated = () => {
    setShowCreateModal(false);
    void fetchItems();
  };

  const handleDeleteItem = async (itemId: number) => {
    const confirmed = window.confirm("Delete this custom item? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setDeleteLoadingId(itemId);
      setError(null);
      await deleteItem(itemId);
      await fetchItems();
    } catch (err) {
      console.error("Failed to delete item:", err);

      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data;

        if (typeof responseData === "string") {
          setError(responseData);
        } else if (
          responseData &&
          typeof responseData === "object" &&
          "message" in responseData &&
          typeof responseData.message === "string"
        ) {
          setError(responseData.message);
        } else {
          setError(err.message || "Failed to delete item.");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete item.");
      }
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter((item) => {
      const searchable = `${item.name} ${item.category}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [items, searchQuery]);

  const globalItems = useMemo(
    () => filteredItems.filter((item) => item.creatorId === null),
    [filteredItems],
  );

  const customItems = useMemo(
    () => filteredItems.filter((item) => item.creatorId !== null),
    [filteredItems],
  );

  const canManageItem = (item: Item) => currentUser !== null && item.creatorId === currentUser.id;

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to lists
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Items Catalog</h1>
            <p className="mt-2 text-sm text-slate-500">Browse global and custom items across your lists</p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm active:scale-[0.99]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Item
          </Button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search item"
              className="h-14 w-full rounded-2xl border border-emerald-500/70 bg-white pl-12 pr-4 text-base text-slate-900 shadow-sm outline-none ring-4 ring-emerald-500/10 transition-all focus-visible:ring-4 focus-visible:ring-emerald-500/20"
            />
          </div>
        </div>

        {loading ? <p className="mt-6 text-sm text-slate-500">Loading items...</p> : null}
        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          filteredItems.length === 0 ? (
            <Card className="mt-6 rounded-xl border border-slate-200 shadow-sm">
              <CardContent className="py-8 text-center text-sm text-slate-500">
                {items.length === 0 ? "No items found." : "No items match your search."}
              </CardContent>
            </Card>
          ) : (
            <div className="mt-8 space-y-10">
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <Box className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">Global Items</h2>
                  <span className="text-sm text-slate-500">({globalItems.length})</span>
                </div>

                {globalItems.length === 0 ? (
                  <p className="text-sm text-slate-500">No global items found.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {globalItems.map((item) => (
                      <div
                        key={item.id}
                        className="inline-flex items-center rounded-full bg-emerald-50 px-5 py-3 text-base font-medium text-emerald-700"
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">Custom Items</h2>
                  <span className="text-sm text-slate-500">({customItems.length})</span>
                </div>

                {customItems.length === 0 ? (
                  <p className="text-sm text-slate-500">No custom items found.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {customItems.map((item) => (
                      <div
                        key={item.id}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2.5 text-base font-medium text-amber-700 transition-all duration-200 hover:shadow-sm"
                      >
                        <span>{item.name}</span>
                        {canManageItem(item) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="rounded-full p-1 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-800"
                              aria-label={`Edit ${item.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteItem(item.id)}
                              disabled={deleteLoadingId === item.id}
                              className="rounded-full p-1 text-amber-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )
        ) : null}

      </div>

      {showCreateModal ? (
        <CreateItemCard
          onCreated={handleItemCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      ) : null}

      {editingItem ? (
        <UpdateItemCard
          item={editingItem}
          onUpdated={() => {
            setEditingItem(null);
            void fetchItems();
          }}
          onCancel={() => setEditingItem(null)}
        />
      ) : null}

    </div>
  );
}
