import { type FormEvent, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface AddItemFormProps {
  onAdd: (name: string) => Promise<void>;
  loading?: boolean;
}

export default function AddItemForm({ onAdd, loading = false }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Name is required.");
      return;
    }

    try {
      setError(null);
      await onAdd(trimmed);
      setName("");
    } catch {
      setError("Failed to add item.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add a new shopping item or list name"
          disabled={loading}
          className="sm:flex-1"
        />
        <Button type="submit" disabled={loading} className="sm:w-auto">
          {loading ? "Adding..." : "Add"}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
