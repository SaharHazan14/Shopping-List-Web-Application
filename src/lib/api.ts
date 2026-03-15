export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No access token found");
  }

  const base = (import.meta as any).env.VITE_API_URL || "http://localhost:3000";
  // Build headers: only include Content-Type when there is a body to send.
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(typeof options.headers === "object" && !(options.headers instanceof Headers)
      ? (options.headers as Record<string, string>)
      : {}),
  };

  if (options.body !== undefined && options.body !== null) {
    // Don't override if caller already set Content-Type
    if (!Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
      headers["Content-Type"] = "application/json";
    }
  }

  // Debug: log outgoing request details (mask Authorization token)
  try {
    const safeHeaders = { ...headers } as Record<string, string>;
    if (safeHeaders.Authorization) safeHeaders.Authorization = "REDACTED";
    console.log("apiFetch ->", {
      url: `${base}${endpoint}`,
      method: (options.method || "GET").toUpperCase(),
      headers: safeHeaders,
      body: options.body ?? null,
    });
  } catch (e) {
    // ignore debug logging errors
  }

  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers,
  });

  // Read raw text first (allows including server message in errors)
  const text = await response.text();

  if (!response.ok) {
    // Log response for easier debugging
    try {
      console.debug("apiFetch <- error", { status: response.status, text });
    } catch (e) {}
    throw new Error(`Request failed: ${response.status} ${text}`);
  }

  // Handle empty responses (204 No Content or empty body) gracefully.
  if (response.status === 204) {
    return {} as T;
  }

  if (!text) return {} as T;

  try {
    const parsed = JSON.parse(text) as T;
    try { console.debug("apiFetch <- success", { status: response.status, parsed }); } catch (e) {}
    return parsed;
  } catch (err) {
    throw new Error(`Failed to parse JSON response: ${String(err)} — raw response: ${text}`);
  }
}