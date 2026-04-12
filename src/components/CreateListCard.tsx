import { useState, type ComponentProps } from "react";
import axios from "axios";
import { createList } from "../api/list";

interface CreateListCardProps {
  onCreated?: () => void | Promise<void>;
}

export default function CreateListCard({ onCreated }: CreateListCardProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateList: NonNullable<ComponentProps<"form">["onSubmit"]> = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setCreateError("Title is required.");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      await createList({
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });

      setTitle("");
      setDescription("");

      if (onCreated) {
        await onCreated();
      }
    } catch (error) {
      console.error("Failed to create list:", error);

      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;

        if (typeof responseData === "string") {
          setCreateError(responseData);
        } else if (
          responseData &&
          typeof responseData === "object" &&
          "message" in responseData &&
          typeof responseData.message === "string"
        ) {
          setCreateError(responseData.message);
        } else {
          setCreateError(error.message || "Failed to create list.");
        }
      } else if (error instanceof Error) {
        setCreateError(error.message);
      } else {
        setCreateError("Failed to create list.");
      }
    } finally {
      setCreateLoading(false);
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
      <h2 style={{ marginTop: 0 }}>Create New List</h2>
      <form onSubmit={handleCreateList}>
        <div style={{ marginBottom: "8px" }}>
          <label htmlFor="title">Title</label>
          <br />
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Groceries"
            style={{ width: "320px", maxWidth: "100%" }}
            disabled={createLoading}
            required
          />
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label htmlFor="description">Description (optional)</label>
          <br />
          <input
            id="description"
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Weekly supermarket run"
            style={{ width: "320px", maxWidth: "100%" }}
            disabled={createLoading}
          />
        </div>

        <button type="submit" disabled={createLoading}>
          {createLoading ? "Creating..." : "Create List"}
        </button>

        {createError ? <p style={{ color: "crimson" }}>{createError}</p> : null}
      </form>
    </div>
  );
}
