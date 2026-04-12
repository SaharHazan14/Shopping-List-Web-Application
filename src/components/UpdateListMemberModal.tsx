import { type ComponentProps, useState } from "react";
import axios from "axios";
import { updateListMember } from "../api/list";
import type { EditableListMemberRole, ListMember, UpdateListMemberPayload } from "../types/list";
import { Select } from "./ui/select";
import { Button } from "./ui/button";

interface UpdateListMemberModalProps {
  listId: number;
  member: ListMember;
  onUpdated: () => void;
  onCancel: () => void;
}

const editableRoles: EditableListMemberRole[] = ["EDITOR", "VIEWER"];

export default function UpdateListMemberModal({
  listId,
  member,
  onUpdated,
  onCancel,
}: UpdateListMemberModalProps) {
  const [role, setRole] = useState<EditableListMemberRole>(
    member.role === "OWNER" ? "VIEWER" : member.role,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = async (event) => {
    event.preventDefault();
    setError(null);

    if (role === member.role) {
      setError("Choose a different role to update this collaborator.");
      return;
    }

    try {
      setLoading(true);
      const payload: UpdateListMemberPayload = { role };
      await updateListMember(listId, member.memberId, payload);
      onUpdated();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message ?? err.message;
        setError(message || "Failed to update collaborator.");
      } else {
        setError("Failed to update collaborator.");
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
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Edit Collaborator</h2>
        <p style={{ marginTop: 0, color: "#666" }}>{member.email}</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="member-role" style={{ display: "block", marginBottom: "4px" }}>
              Role
            </label>
            <Select
              id="member-role"
              value={role}
              onChange={(value) => setRole(value as EditableListMemberRole)}
              options={editableRoles.map((editableRole) => ({
                value: editableRole,
                label: editableRole,
              }))}
              disabled={loading}
            />
          </div>

          {error ? (
            <div style={{ color: "crimson", marginBottom: "16px", fontSize: "14px" }}>{error}</div>
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
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}