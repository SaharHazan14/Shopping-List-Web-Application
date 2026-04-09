import { type ComponentProps, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { addListMember } from "../api/list";
import { getUsers } from "../api/user";
import type { AddListMemberPayload, EditableListMemberRole } from "../types/list";
import type { CurrentUser } from "../types/user";

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
                <select
                  id="member-id"
                  value={memberId ?? ""}
                  onChange={(event) => setMemberId(Number(event.target.value))}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  {candidateUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="member-role" style={{ display: "block", marginBottom: "4px" }}>
                  Role
                </label>
                <select
                  id="member-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as EditableListMemberRole)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  {roleOptions.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {roleOption}
                    </option>
                  ))}
                </select>
              </div>

              {submitError ? (
                <div style={{ color: "crimson", marginBottom: "16px", fontSize: "14px" }}>
                  {submitError}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                  }}
                >
                  {loading ? "Adding..." : "Add Collaborator"}
                </button>
              </div>
            </form>
          )
        ) : null}
      </div>
    </div>
  );
}