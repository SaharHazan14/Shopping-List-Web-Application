import { useState, type ComponentProps } from "react";
import axios from "axios";
import { updateListDetails } from "../api/list";

interface UpdateListCardProps {
  listId: number;
  initialTitle: string;
  initialDescription: string | null;
  onUpdated?: () => void | Promise<void>;
  onCancel?: () => void;
}

export default function UpdateListCard({
  listId,
  initialTitle,
  initialDescription,
  onUpdated,
  onCancel,
}: UpdateListCardProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleUpdateList: NonNullable<ComponentProps<"form">["onSubmit"]> = async (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    const payload: { title?: string; description?: string } = {};

    if (trimmedTitle) {
      payload.title = trimmedTitle;
    }

    if (trimmedDescription) {
      payload.description = trimmedDescription;
    }

    if (!payload.title && !payload.description) {
      setUpdateError("Provide at least one field: title or description.");
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateError(null);

      await updateListDetails(listId, payload);

      if (onUpdated) {
        await onUpdated();
      }
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
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        maxWidth: "420px",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Update List Details</h2>
      <form onSubmit={handleUpdateList}>
        <div style={{ marginBottom: "8px" }}>
          <label htmlFor="update-title">Title</label>
          <br />
          <input
            id="update-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            style={{ width: "320px", maxWidth: "100%" }}
            disabled={updateLoading}
          />
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label htmlFor="update-description">Description</label>
          <br />
          <input
            id="update-description"
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            style={{ width: "320px", maxWidth: "100%" }}
            disabled={updateLoading}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button type="submit" disabled={updateLoading}>
            {updateLoading ? "Updating..." : "Update Details"}
          </button>
          <button type="button" onClick={onCancel} disabled={updateLoading}>
            Cancel
          </button>
        </div>

        {updateError ? <p style={{ color: "crimson" }}>{updateError}</p> : null}
      </form>
    </div>
  );
}
