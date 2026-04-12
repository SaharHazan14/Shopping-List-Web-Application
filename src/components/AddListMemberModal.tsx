import { type ComponentProps, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { addListMember } from "../api/list";
import { getUsers } from "../api/user";
import type { AddListMemberPayload, EditableListMemberRole } from "../types/list";
import type { CurrentUser } from "../types/user";
import { Select } from "./ui/select";
import { Button } from "./ui/button";

interface AddListMemberModalProps {
  listId: number;
  existingMemberIds: number[];
  onAdded: () => void;
  onCancel: () => void;
}

const roleOptions: EditableListMemberRole[] = ["EDITOR", "VIEWER"];

export default function AddListMemberModal({
  listId,
  existingMemberIds,
  onAdded,
  onCancel,
}: AddListMemberModalProps) {
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [role, setRole] = useState<EditableListMemberRole>("VIEWER");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const candidateUsers = useMemo(
    () => users.filter((user) => !existingMemberIds.includes(user.id)),
    [existingMemberIds, users],
  );

  useEffect(() => {
    async function fetchUsers() {
      try {
        setUsersLoading(true);
        setUsersError(null);
        const response = await getUsers();
        setUsers(response);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setUsersError("Failed to load users catalog.");
      } finally {
        setUsersLoading(false);
      }
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    if (candidateUsers.length > 0) {
      setMemberId(candidateUsers[0].id);
    } else {
      setMemberId(null);
    }
  }, [candidateUsers]);

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    if (memberId === null) {
      setSubmitError("Select a user to add.");
      return;
    }

    try {
      setLoading(true);
      const payload: AddListMemberPayload = {
        memberId,
        role,
      };

      await addListMember(listId, payload);
      onAdded();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message ?? err.message;
        setSubmitError(message || "Failed to add collaborator.");
      } else {
        setSubmitError("Failed to add collaborator.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "460px",
          width: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Add Collaborator</h2>

        {usersLoading ? <p>Loading users...</p> : null}
        {usersError ? <p style={{ color: "crimson" }}>{usersError}</p> : null}

        {!usersLoading && !usersError ? (
          candidateUsers.length === 0 ? (
            <p>All users are already collaborators on this list.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="member-id" style={{ display: "block", marginBottom: "4px" }}>
                  User
                </label>
                <Select
                  id="member-id"
                  value={memberId ?? ""}
                  onChange={(value) => setMemberId(value ? Number(value) : null)}
                  options={candidateUsers.map((user) => ({
                    value: user.id,
                    label: user.email,
                  }))}
                  placeholder="Select user"
                  disabled={loading || candidateUsers.length === 0}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="member-role" style={{ display: "block", marginBottom: "4px" }}>
                  Role
                </label>
                <Select
                  id="member-role"
                  value={role}
                  onChange={(value) => setRole(value as EditableListMemberRole)}
                  options={roleOptions.map((roleOption) => ({
                    value: roleOption,
                    label: roleOption,
                  }))}
                  disabled={loading}
                />
              </div>

              {submitError ? (
                <div style={{ color: "crimson", marginBottom: "16px", fontSize: "14px" }}>
                  {submitError}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <Button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Collaborator"}
                </Button>
              </div>
            </form>
          )
        ) : null}
      </div>
    </div>
  );
}