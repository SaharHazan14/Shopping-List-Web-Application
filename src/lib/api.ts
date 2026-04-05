export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Simple in-flight dedupe map for GET requests to avoid duplicate network calls
  // (useful in development when StrictMode mounts components twice).
  // Key is method + endpoint; only dedupe GET/HEAD without body.
  const method = (options.method || "GET").toUpperCase();
  const bodyPresent = options.body !== undefined && options.body !== null;
  const signalPresent = (options as any).signal !== undefined && (options as any).signal !== null;
  // module-level map initialized lazily
  (globalThis as any).__apiFetchInFlight = (globalThis as any).__apiFetchInFlight || new Map<string, Promise<any>>();
  const inFlight: Map<string, Promise<any>> = (globalThis as any).__apiFetchInFlight;
  const dedupeKey = `${method} ${endpoint}`;
  // Only dedupe safe idempotent GET/HEAD requests that don't provide a body or an AbortSignal.
  if ((method === 'GET' || method === 'HEAD') && !bodyPresent && !signalPresent) {
    const existing = inFlight.get(dedupeKey) as Promise<T> | undefined;
    if (existing) return existing;
  }
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

  const exec = async (): Promise<T> => {
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
  };

  // If deduping allowed, store promise in map so concurrent callers get the same promise
  let promise: Promise<T>;
  if ((method === 'GET' || method === 'HEAD') && !bodyPresent && !signalPresent) {
    promise = exec();
    inFlight.set(dedupeKey, promise);
    // ensure removal once settled
    promise.finally(() => { inFlight.delete(dedupeKey); });
  } else {
    promise = exec();
  }

  return promise;
}