import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ChevronLeft, Minus, Plus, Trash2, User, Users } from "lucide-react";
import {
  deleteListItem,
  getListById,
  getListItems,
  getListMembers,
  updateListItem,
} from "../api/list";
import { getCurrentUser } from "../api/user";
import type { ListDetails, ListItem, ListMember } from "../types/list";
import type { CurrentUser } from "../types/user";
import AddItemToListModal from "../components/AddItemToListModal";
import ManageCollaboratorsDialog from "../components/ManageCollaboratorsDialog";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const [list, setList] = useState<ListDetails | null>(null);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [listMembers, setListMembers] = useState<ListMember[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCollaboratorsDialog, setShowCollaboratorsDialog] = useState(false);
  const [itemActionLoadingId, setItemActionLoadingId] = useState<number | null>(null);

  const parsedListId = useMemo(() => {
    if (!listId) return null;
    const value = Number(listId);
    return Number.isFinite(value) ? value : null;
  }, [listId]);

  useEffect(() => {
    async function fetchCurrentUserProfile() {
      try {
        const profile = await getCurrentUser();
        setCurrentUser(profile);
      } catch (fetchError) {
        console.error("Failed to fetch current user:", fetchError);
      }
    }

    fetchCurrentUserProfile();
  }, []);

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

  const fetchItems = async () => {
    if (parsedListId === null) {
      setItemsError("Invalid list id");
      setItemsLoading(false);
      return;
    }

    try {
      setItemsLoading(true);
      setItemsError(null);
      const response = await getListItems(parsedListId);
      setListItems(response);
    } catch (fetchError) {
      console.error("Failed to fetch list items:", fetchError);
      setItemsError("Failed to load list items.");
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [parsedListId]);

  const fetchMembers = async () => {
    if (parsedListId === null) {
      setMembersError("Invalid list id");
      setMembersLoading(false);
      return;
    }

    try {
      setMembersLoading(true);
      setMembersError(null);
      const response = await getListMembers(parsedListId);
      setListMembers(response);
    } catch (fetchError) {
      console.error("Failed to fetch list members:", fetchError);
      setMembersError("Failed to load list members.");
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [parsedListId]);

  const handleDeleteItem = async (itemId: number) => {
    if (parsedListId === null) return;

    const confirmed = window.confirm("Remove this item from the list?");
    if (!confirmed) return;

    try {
      setItemActionLoadingId(itemId);
      await deleteListItem(parsedListId, itemId);
      await fetchItems();
    } catch (err) {
      console.error("Failed to delete item:", err);
      setItemsError("Failed to delete item.");
    } finally {
      setItemActionLoadingId(null);
    }
  };

  const handleAdjustQuantity = async (item: ListItem, delta: number) => {
    if (parsedListId === null) return;

    const nextQuantity = Math.max(1, item.quantity + delta);
    if (nextQuantity === item.quantity) return;

    try {
      setItemActionLoadingId(item.itemId);
      await updateListItem(parsedListId, item.itemId, { quantity: nextQuantity });
      await fetchItems();
    } catch (err) {
      console.error("Failed to update item quantity:", err);
      setItemsError("Failed to update item quantity.");
    } finally {
      setItemActionLoadingId(null);
    }
  };

  const handleToggleChecked = async (item: ListItem) => {
    if (parsedListId === null) return;

    try {
      setItemActionLoadingId(item.itemId);
      await updateListItem(parsedListId, item.itemId, { isChecked: !item.isChecked });
      await fetchItems();
    } catch (err) {
      console.error("Failed to update item status:", err);
      setItemsError("Failed to update item status.");
    } finally {
      setItemActionLoadingId(null);
    }
  };

  const owner = useMemo(
    () => listMembers.find((member) => member.role === "OWNER") ?? null,
    [listMembers],
  );
  const canManageCollaborators = currentUser !== null && list !== null && currentUser.id === list.creatorId;

  const creatorEmail = owner?.email ?? `creator-${list?.creatorId ?? "unknown"}@unknown`;

  const totalItems = listItems.length;
  const uncheckedItems = useMemo(
    () => listItems.filter((item) => !item.isChecked),
    [listItems],
  );
  const checkedItems = useMemo(
    () => listItems.filter((item) => item.isChecked),
    [listItems],
  );
  const checkedCount = checkedItems.length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const renderItemRow = (item: ListItem) => (
    <li
      key={item.itemId}
      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md ${
        item.isChecked
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-slate-200 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => handleToggleChecked(item)}
        disabled={itemActionLoadingId === item.itemId}
        className={`group flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors duration-200 ease-out ${
          item.isChecked ? "hover:bg-emerald-100/70" : "hover:bg-slate-100"
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 ease-out ${
            item.isChecked
              ? "border-emerald-500 bg-emerald-500/15"
              : "border-slate-300 group-hover:border-slate-400"
          }`}
        >
          {item.isChecked ? <Check className="h-3 w-3 text-emerald-600" /> : null}
        </span>
        <span
          className={`truncate text-[15px] font-medium ${
            item.isChecked ? "text-slate-400 line-through opacity-75" : "text-slate-900"
          }`}
        >
          {item.itemName}
        </span>
      </button>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleAdjustQuantity(item, -1)}
          disabled={itemActionLoadingId === item.itemId || item.quantity <= 1}
          aria-label={`Decrease ${item.itemName} quantity`}
          className="h-8 w-8 cursor-pointer rounded-full p-0 text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-6 text-center text-sm font-semibold text-slate-600">{item.quantity}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleAdjustQuantity(item, 1)}
          disabled={itemActionLoadingId === item.itemId}
          aria-label={`Increase ${item.itemName} quantity`}
          className="h-8 w-8 cursor-pointer rounded-full p-0 text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDeleteItem(item.itemId)}
          disabled={itemActionLoadingId === item.itemId}
          aria-label={`Delete ${item.itemName}`}
          className="h-8 w-8 cursor-pointer rounded-full p-0 text-red-500 transition-all duration-200 ease-out hover:bg-red-50 hover:text-red-600 active:scale-95"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to lists
        </Link>

        {loading ? <p className="mt-6 text-sm text-slate-500">Loading list details...</p> : null}
        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

        {!loading && !error && list ? (
          <div className="mt-5 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-slate-600">
                <User className="h-4 w-4" />
                <span className="text-sm text-slate-500">{creatorEmail}</span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="gap-2 transition-all duration-200 hover:shadow-sm"
                onClick={() => setShowCollaboratorsDialog(true)}
              >
                <Users className="h-4 w-4" />
                Collaborators
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {membersLoading ? "..." : listMembers.length}
                </span>
              </Button>
            </div>
            {membersError ? <p className="text-sm text-red-600">{membersError}</p> : null}

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{list.title}</h1>
              <p className="mt-2 text-sm text-slate-500">{list.description || "No description"}</p>
            </div>

            <Card className="rounded-xl border border-slate-200 shadow-sm">
              <CardContent className="space-y-3 py-5">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-xl font-semibold text-slate-900">{checkedCount}/{totalItems} items</span>
                  <span className="text-sm font-medium text-slate-500">{progress}% complete</span>
                </div>
                <div className="h-3.5 overflow-hidden rounded-full bg-slate-200/90">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Items</h2>
              <Button
                onClick={() => setShowAddItemModal(true)}
                className="bg-emerald-600 transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm active:scale-[0.99]"
              >
                Add Item
              </Button>
            </div>

            {itemsLoading ? <p className="text-sm text-slate-500">Loading items...</p> : null}
            {itemsError ? <p className="text-sm text-red-600">{itemsError}</p> : null}

            {!itemsLoading && !itemsError ? (
              listItems.length === 0 ? (
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                  <CardContent className="py-8 text-center text-sm text-slate-500">No items in this list yet.</CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      To Buy ({uncheckedItems.length})
                    </p>
                    {uncheckedItems.length === 0 ? (
                      <Card className="rounded-xl border border-slate-200 shadow-sm">
                        <CardContent className="py-4 text-sm text-slate-500">No unchecked items.</CardContent>
                      </Card>
                    ) : (
                      <ul className="space-y-2.5">{uncheckedItems.map(renderItemRow)}</ul>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Completed ({checkedItems.length})
                    </p>
                    {checkedItems.length === 0 ? (
                      <Card className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 shadow-sm">
                        <CardContent className="py-4 text-sm text-slate-500">No completed items yet.</CardContent>
                      </Card>
                    ) : (
                      <ul className="space-y-2.5">{checkedItems.map(renderItemRow)}</ul>
                    )}
                  </div>
                </div>
              )
            ) : null}
          </div>
        ) : null}

      {showAddItemModal && parsedListId !== null ? (
        <AddItemToListModal
          listId={parsedListId}
          onItemAdded={() => {
            setShowAddItemModal(false);
            fetchItems();
          }}
          onCancel={() => setShowAddItemModal(false)}
        />
      ) : null}

      {showCollaboratorsDialog && parsedListId !== null && list ? (
        <ManageCollaboratorsDialog
          open={showCollaboratorsDialog}
          listId={parsedListId}
          listTitle={list.title}
          members={listMembers}
          canManage={canManageCollaborators}
          onOpenChange={setShowCollaboratorsDialog}
          onMembersChanged={() => {
            void fetchMembers();
          }}
        />
      ) : null}
      </div>
    </div>
  );
}
