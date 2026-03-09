export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No access token found");
  }

  const base = (import.meta as any).env.VITE_API_URL || "http://localhost:3000";
  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  // Handle empty responses (204 No Content or empty body) gracefully.
  // Some endpoints (DELETE) may return no JSON body which would cause
  // response.json() to throw 'Unexpected end of JSON input'.
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    // If parsing fails, throw a descriptive error including the raw text for debugging
    throw new Error(`Failed to parse JSON response: ${String(err)} — raw response: ${text}`);
  }
}