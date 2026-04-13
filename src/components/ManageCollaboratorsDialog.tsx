import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { UserPlus, X } from "lucide-react";
import { addListMember, deleteListMember, updateListMember } from "../api/list";
import { getUsers } from "../api/user";
import type { EditableListMemberRole, ListMember } from "../types/list";
import type { CurrentUser } from "../types/user";
import { Button } from "./ui/button";
import { Select } from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface ManageCollaboratorsDialogProps {
  open: boolean;
  listId: number;
  listTitle: string;
  members: ListMember[];
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onMembersChanged: () => void;
}

const editableRoles: EditableListMemberRole[] = ["EDITOR", "VIEWER"];

function formatRole(role: ListMember["role"]): string {
  const lowered = role.toLowerCase();
  return lowered.charAt(0).toUpperCase() + lowered.slice(1);
}

function getUserLabel(email: string): string {
  const [namePart] = email.split("@");
  return namePart || email;
}

export default function ManageCollaboratorsDialog({
  open,
  listId,
  listTitle,
  members,
  canManage,
  onOpenChange,
  onMembersChanged,
}: ManageCollaboratorsDialogProps) {
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<EditableListMemberRole>("VIEWER");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<number | null>(null);

  const existingMemberIds = useMemo(() => members.map((member) => member.memberId), [members]);

  const candidateUsers = useMemo(
    () => users.filter((user) => !existingMemberIds.includes(user.id)),
    [users, existingMemberIds],
  );

  const sortedMembers = useMemo(() => {
    return [...members].sort((first, second) => {
      if (first.role === "OWNER") return -1;
      if (second.role === "OWNER") return 1;
      return first.email.localeCompare(second.email);
    });
  }, [members]);

  useEffect(() => {
    if (!open || !canManage) return;

    async function fetchUsersCatalog() {
      try {
        setUsersLoading(true);
        setUsersError(null);
        const response = await getUsers();
        setUsers(response);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setUsersError("Failed to load users catalog.");
      } finally {
        setUsersLoading(false);
      }
    }

    fetchUsersCatalog();
  }, [canManage, open]);

  useEffect(() => {
    if (!open) return;

    if (selectedMemberId === null) return;

    const hasSelection = candidateUsers.some((candidate) => candidate.id === selectedMemberId);
    if (!hasSelection) {
      setSelectedMemberId(null);
    }
  }, [candidateUsers, open, selectedMemberId]);

  const handleAddCollaborator = async () => {
    if (!canManage) return;

    setSubmitError(null);

    if (selectedMemberId === null) {
      setSubmitError("Select a user to add.");
      return;
    }

    try {
      setSubmitLoading(true);
      await addListMember(listId, {
        memberId: selectedMemberId,
        role: selectedRole,
      });
      onMembersChanged();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message ?? error.message;
        setSubmitError(message || "Failed to add collaborator.");
      } else {
        setSubmitError("Failed to add collaborator.");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRoleChange = async (member: ListMember, role: EditableListMemberRole) => {
    if (!canManage || member.role === "OWNER") return;

    try {
      setMemberActionLoadingId(member.memberId);
      await updateListMember(listId, member.memberId, { role });
      onMembersChanged();
    } catch (error) {
      console.error("Failed to update collaborator role:", error);
      setSubmitError("Failed to update collaborator role.");
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  const handleRemoveCollaborator = async (member: ListMember) => {
    if (!canManage || member.role === "OWNER") return;

    const confirmed = window.confirm(`Remove ${member.email} from collaborators?`);
    if (!confirmed) return;

    try {
      setMemberActionLoadingId(member.memberId);
      await deleteListMember(listId, member.memberId);
      onMembersChanged();
    } catch (error) {
      console.error("Failed to remove collaborator:", error);
      setSubmitError("Failed to remove collaborator.");
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Collaborators</DialogTitle>
          {canManage ? (
            <DialogDescription>
              Add people to <span className="font-semibold text-slate-800">{listTitle}</span>
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {canManage ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_auto]">
              <Select
                value={selectedMemberId ?? ""}
                onChange={(value) => setSelectedMemberId(value ? Number(value) : null)}
                options={[
                  { value: "", label: "Select user" },
                  ...candidateUsers.map((user) => ({
                    value: user.id,
                    label: user.email,
                  })),
                ]}
                disabled={usersLoading || submitLoading || candidateUsers.length === 0}
              />

              <Select
                value={selectedRole}
                onChange={(value) => setSelectedRole(value as EditableListMemberRole)}
                options={editableRoles.map((role) => ({
                  value: role,
                  label: formatRole(role),
                }))}
                disabled={submitLoading || candidateUsers.length === 0}
              />

              <Button
                type="button"
                onClick={() => void handleAddCollaborator()}
                disabled={submitLoading || candidateUsers.length === 0 || selectedMemberId === null}
                className="h-10 rounded-lg bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700"
                aria-label="Add collaborator"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {usersError ? <p className="text-sm text-red-600">{usersError}</p> : null}
            {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
            {candidateUsers.length === 0 ? (
              <p className="text-sm text-slate-500">All users are already collaborators on this list.</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">You can view collaborators but only the list owner can manage them.</p>
        )}

        <div className="mt-3 space-y-2.5">
          {sortedMembers.map((member) => {
            const isOwner = member.role === "OWNER";
            const isLoading = memberActionLoadingId === member.memberId;

            return (
              <div
                key={member.memberId}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold uppercase text-emerald-700">
                    {member.email.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{getUserLabel(member.email)}</p>
                    <p className="truncate text-sm text-slate-500">{member.email}</p>
                  </div>
                </div>

                {isOwner ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Owner
                  </span>
                ) : canManage ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onChange={(value) => void handleRoleChange(member, value as EditableListMemberRole)}
                      options={editableRoles.map((role) => ({
                        value: role,
                        label: formatRole(role),
                      }))}
                      disabled={isLoading}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleRemoveCollaborator(member)}
                      disabled={isLoading}
                      className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${member.email}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {formatRole(member.role)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
